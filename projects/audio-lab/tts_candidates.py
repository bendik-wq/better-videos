#!/usr/bin/env python3
"""CPU trial of an alternative open TTS against Kokoro, on the benchmark paragraph.

usage: python3 projects/audio-lab/tts_candidates.py <out dir> <reference voice wav>
       (model dir: .cache/audio-lab/cbt, a plain copy of the HF repo ResembleAI/chatterbox-turbo-ONNX
        with onnx/{language_model,embed_tokens,speech_encoder}_q4 and conditional_decoder_quantized;
        onnxruntime refuses external weights behind the HF cache's symlinks)

Chatterbox-Turbo (Resemble AI, MIT code + weights, 350M) via its official ONNX export, run with
onnxruntime on this CPU: language model q4, speech encoder q4, embed q4, decoder q8 (~0.8 GB).
Chatterbox clones the voice of a reference clip; to avoid cloning a real person we feed it a
Kokoro af_heart render (Apache-2.0 output). Greedy decoding, repetition penalty 1.2, as the
model card's example. The watermark step (Perth) is skipped: it needs torch.
Measures RTF and the same intelligibility/prosody numbers as voice_bench.py.
"""
import json, os, sys, time
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "engine")); sys.path.insert(0, os.path.dirname(__file__))
from voice_bench import PARAGRAPH, wer  # noqa: E402
from music import speech  # noqa: E402

M = "ResembleAI/chatterbox-turbo-ONNX"; SR = 24000
START, STOP, SIL, KVH, HD = 6561, 6562, 4299, 16, 64


def chatterbox(text, ref_wav, dtypes=("q4", "q4", "q4", "quantized")):
    import onnxruntime as ort, soundfile as sf
    from scipy.signal import resample_poly
    from transformers import AutoTokenizer
    MD = os.path.join(ROOT, ".cache", "audio-lab", "cbt")
    names = ("language_model", "embed_tokens", "speech_encoder", "conditional_decoder")
    so = ort.SessionOptions(); so.intra_op_num_threads = os.cpu_count()
    S = {n: ort.InferenceSession(os.path.join(MD, "onnx", f"{n}_{d}.onnx"), so) for n, d in zip(names, dtypes)}
    a, sr = sf.read(ref_wav)
    if a.ndim > 1: a = a.mean(1)
    if sr != SR: a = resample_poly(a, SR // np.gcd(SR, sr), sr // np.gcd(SR, sr))
    a = a[None, :].astype(np.float32)
    tok = AutoTokenizer.from_pretrained(MD)
    ids = tok(text, return_tensors="np")["input_ids"].astype(np.int64)
    gen = np.array([[START]], np.int64)
    t0 = time.time()
    for i in range(1500):
        emb = S["embed_tokens"].run(None, {"input_ids": ids})[0]
        if i == 0:
            cond, prompt, spk_emb, spk_feat = S["speech_encoder"].run(None, {"audio_values": a})
            emb = np.concatenate((cond, emb), axis=1)
            b, L, _ = emb.shape
            pkv = {x.name: np.zeros([b, KVH, 0, HD], np.float16 if x.type == "tensor(float16)" else np.float32)
                   for x in S["language_model"].get_inputs() if "past_key_values" in x.name}
            mask = np.ones((b, L), np.int64); pos = np.arange(L, dtype=np.int64)[None]
        logits, *present = S["language_model"].run(None, dict(inputs_embeds=emb, attention_mask=mask, position_ids=pos, **pkv))
        lg = logits[:, -1, :].copy()
        sc = np.take_along_axis(lg, gen, axis=1); sc = np.where(sc < 0, sc * 1.2, sc / 1.2); np.put_along_axis(lg, gen, sc, axis=1)
        ids = np.argmax(lg, axis=-1, keepdims=True).astype(np.int64)
        gen = np.concatenate((gen, ids), axis=-1)
        if ids.item() == STOP: break
        mask = np.concatenate([mask, np.ones((1, 1), np.int64)], 1); pos = pos[:, -1:] + 1
        for j, k in enumerate(pkv): pkv[k] = present[j]
    t_lm = time.time() - t0
    toks = np.concatenate([prompt, gen[:, 1:-1], np.full((1, 3), SIL, np.int64)], axis=1)
    wav = S["conditional_decoder"].run(None, dict(speech_tokens=toks, speaker_embeddings=spk_emb, speaker_features=spk_feat))[0].squeeze(0)
    return wav, time.time() - t0, t_lm


def main():
    out, ref = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    import soundfile as sf
    from faster_whisper import WhisperModel
    wav, t, t_lm = chatterbox(PARAGRAPH, ref)
    p = os.path.join(out, "chatterbox-turbo-q4.wav"); sf.write(p, wav, SR)
    wm = WhisperModel("small.en", device="cpu", compute_type="int8")
    segs, _ = wm.transcribe(p, word_timestamps=True, language="en", beam_size=1)
    ws = [w for s in segs for w in s.words]; hyp = " ".join(w.word for w in ws)
    from scipy.signal import resample_poly
    row = dict(engine="chatterbox-turbo (onnx q4/q8)", rtf=round(t / (len(wav) / SR), 2), lm_seconds=round(t_lm, 1),
               wer=round(wer(PARAGRAPH, hyp), 3), word_prob=round(float(np.mean([w.probability for w in ws])), 3), hyp=hyp.strip(),
               **speech.profile(resample_poly(wav, 2, 1), 48000, words=PARAGRAPH.split()))
    json.dump(row, open(os.path.join(out, "chatterbox.json"), "w"), indent=1)
    print(json.dumps(row))


if __name__ == "__main__":
    main()
