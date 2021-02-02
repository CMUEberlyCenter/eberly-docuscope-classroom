import pandas as pd
from ds_tones import TONES_FRAME
from common_dictionary import COMMON_DICTIONARY_FRAME

LAT_FRAME = pd.merge(COMMON_DICTIONARY_FRAME, TONES_FRAME, how="right", on="cluster")
LAT_FRAME['cluster'] = LAT_FRAME['cluster'].astype("string")
