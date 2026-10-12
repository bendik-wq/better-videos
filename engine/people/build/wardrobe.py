# Wardrobe spec for mpfb_build.py. Bodies are MakeHuman macro phenotypes (CC0 base mesh and
# targets); every garment id below is CC0 or CC-BY (credited in assets/CREDITS.md).
# phenotype: gender 0 (f) .. 1 (m); age 0.5 = 25 y, 1.0 = 90 y; muscle / weight 0..1; height 0..1;
# proportions 1 = idealised, 0.5 = average (we keep ~0.6-0.8: real, not heroic).
def P(gender=1.0, age=0.55, muscle=0.5, weight=0.5, height=0.55, proportions=0.7, race=None):
    d = dict(gender=gender, age=age, muscle=muscle, weight=weight, height=height, proportions=proportions)
    if race: d['race'] = race
    return d

EUR = dict(caucasian=0.9, african=0.05, asian=0.05)
AFR = dict(caucasian=0.1, african=0.85, asian=0.05)
ASI = dict(caucasian=0.1, african=0.05, asian=0.85)
MIX = dict(caucasian=0.5, african=0.25, asian=0.25)
SK = lambda n: f'{n}/{n}.mhmat'
C = lambda n: f'{n}/{n}.mhclo'

WARDROBE = {
  # business suit: charcoal two-piece, white shirt, tie (system CC0) + leather shoes
  'suit':      dict(phenotype=P(age=0.6, weight=0.52, muscle=0.55, race=EUR), hair=C('short02'), skin=SK('middleage_caucasian_male'),
                    clothes=[C('male_elegantsuit01'), C('shoes02')], fabric={'male_elegantsuit01': 'wool'}),
  'suit_b':    dict(phenotype=P(age=0.75, weight=0.68, muscle=0.45, height=0.5, race=MIX), hair=C('short04'), skin=SK('old_caucasian_male'),
                    clothes=[C('toigo_male_suit_3'), C('shoes02')]),
  'suit_f':    dict(phenotype=P(gender=0.0, age=0.55, weight=0.45, height=0.5, race=ASI), hair=C('bob02'), skin=SK('young_asian_female'),
                    clothes=[C('female_elegantsuit01'), C('toigo_flats')]),
  # overcoat: the long belted coat over a suit (recoloured camel/charcoal at runtime)
  'overcoat':  dict(phenotype=P(age=0.65, weight=0.55, height=0.62, race=EUR), hair=C('short02'), skin=SK('middleage_caucasian_male'),
                    clothes=[C('male_elegantsuit01'), C('punkduck_winter_coat'), C('shoes02')]),
  # military: flight-suit coveralls (recoloured olive), plate carrier, patrol cap, boots
  'military':  dict(phenotype=P(age=0.5, muscle=0.7, weight=0.5, height=0.6, race=MIX), hair=C('short04'), skin=SK('young_african_male'),
                    clothes=[C('elvs_male_coveralls_1'), C('mindfront_tactical_vest_male'), C('mindfront_patrol_cap'), C('culturalibre_male_boots')]),
  'hoodie':    dict(phenotype=P(age=0.42, weight=0.45, muscle=0.5, height=0.58, race=EUR), hair=C('short01'), skin=SK('young_caucasian_male'),
                    clothes=[C('elvs_hooded_sweat_jacket1'), C('punkduck_male_classic_jeans'), C('culturalibre_sneakers')]),
  'office':    dict(phenotype=P(age=0.55, weight=0.6, muscle=0.45, height=0.55, race=ASI), hair=C('short02'), skin=SK('middleage_asian_male'),
                    clothes=[C('elvs_male_shirt_tie_tucked1'), C('elvs_male_trouser'), C('mindfront_shoes_oxford_male')]),
  'office_f':  dict(phenotype=P(gender=0.0, age=0.5, weight=0.5, height=0.48, race=AFR), hair=C('ponytail01'), skin=SK('young_african_female'),
                    clothes=[C('toigo_female_suit'), C('toigo_flats')]),
  'analyst':   dict(phenotype=P(age=0.48, weight=0.5, muscle=0.4, height=0.55, race=EUR), hair=C('short02'), skin=SK('young_caucasian_male2'),
                    clothes=[C('toigo_fisherman_sweater'), C('elvs_male_trouser'), C('shoes02')]),
  'casual_a':  dict(phenotype=P(age=0.45, weight=0.55, height=0.6, race=AFR), hair=C('short01'), skin=SK('young_african_male'),
                    clothes=[C('male_casualsuit01'), C('shoes04')]),
  'casual_b':  dict(phenotype=P(age=0.6, weight=0.62, height=0.52, race=EUR), hair=C('short03'), skin=SK('middleage_caucasian_male'),
                    clothes=[C('male_casualsuit05'), C('shoes04')]),
  'casual_f':  dict(phenotype=P(gender=0.0, age=0.45, weight=0.48, height=0.5, race=EUR), hair=C('long01'), skin=SK('young_caucasian_female'),
                    clothes=[C('toigo_fisherman_sweater'), C('elvs_jeans_straight_leg'), C('toigo_ankle_boots_female')]),
  # protestor: hoodie + beanie (placard is a prop gripped by the hands at runtime)
  'protestor': dict(phenotype=P(age=0.4, weight=0.47, height=0.56, race=MIX), hair=C('short01'), skin=SK('young_african_male'),
                    clothes=[C('elvs_hooded_sweat_jacket1'), C('elvs_jeans_straight_leg'), C('elvs_slouchy_beanie1'), C('punkduck_running_shoes_01')]),
  # lab coat: the long coat in white over shirt and trousers
  'labcoat':   dict(phenotype=P(age=0.6, weight=0.5, height=0.55, race=ASI), hair=C('short02'), skin=SK('middleage_asian_male'),
                    clothes=[C('elvs_male_shirt_tie_tucked1'), C('elvs_male_trouser'), C('punkduck_winter_coat'), C('shoes02')]),
  # hooded robe (replaces the Palantir lathe robes): monk robe + deep hood, cloth folds modelled
  'robe':      dict(phenotype=P(age=0.6, weight=0.5, height=0.62, race=EUR), hair='', skin=SK('middleage_caucasian_male'),
                    clothes=[C('donitz_monk_robe'), C('donitz_monk_robe_hood'), C('shoes02')]),
}
