"""Non-standard boxplot wisker calculation."""
from pandas import DataFrame, Series


def bounded_fences(quants: DataFrame) -> tuple[Series, Series]:
    """Returns the upper and lower inner fences bounded by the
       minimum and maximum values.

       Author acknowledges that this is not the proper formation
       of wiskers for boxplots, but it is what the client asks for."""
    iqr: Series = quants.loc[0.75] - quants.loc[0.25]
    upper_inner_fence: Series = quants.loc[0.75] + 1.5 * iqr
    upper_inner_fence = upper_inner_fence.clip(lower=quants.loc[0], upper=quants.loc[1])
    lower_inner_fence: Series = quants.loc[0.25] - 1.5 * iqr
    lower_inner_fence = lower_inner_fence.clip(lower=quants.loc[0], upper=quants.loc[1])
    return upper_inner_fence, lower_inner_fence
