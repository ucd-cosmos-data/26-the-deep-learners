---
title: "Mini Project #2: Exploring the Relation between Income and Drinking"
---

## Overview

In this analysis, we explored health and socioeconomic differences among California counties. We created visualizations to examine the relationship between median household income and binge-drinking prevalence.

## County Visualization
<figure id="income_map" style="margin: 2rem auto; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); background: #ffffff;">
    <iframe src="26-the-deep-learners/static//HTMLs/median_household_income_choropleth.html"
    style="width: 100%; height: 600px; border: none; border-radius: 6px;"
    scrolling="no">
    </iframe>
    <figcaption style="text-align: center; font-size: 0.9rem; color: #666"; margin-top: 0.5rem;>
        Figure 1 - Median Household Income Choropleth
    </figcaption>
</figure>

<figure id="income_map" style="margin: 2rem auto; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); background: #ffffff;">
    <iframe src="26-the-deep-learners/static/HTMLs/binge_drinking_choropleth.html"
    style="width: 100%; height: 600px; border: none; border-radius: 6px;"
    scrolling="no">
    </iframe>
    <figcaption style="text-align: center; font-size: 0.9rem; color: #666"; margin-top: 0.5rem;>
        Figure 2 - Binge Drinking Choropleth
    </figcaption>
</figure>
## Median Household Income vs. Binge Drinking

<figure id="income_map" style="margin: 2rem auto; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); background: #ffffff;">
    <iframe src="26-the-deep-learners/static/HTMLs/scatterplot.html"
    style="width: 100%; height: 600px; border: none; border-radius: 6px;"
    scrolling="no">
    </iframe>
    <figcaption style="text-align: center; font-size: 0.9rem; color: #666"; margin-top: 0.5rem;>
        Figure 1 - Median Household Income Choropleth
    </figcaption>
</figure>

This scatterplot compares median household income with adjusted binge-drinking prevalence. Each point represents a California county.

The trendline suggests a weak negative relationship. Counties with higher median household incomes tend to have slightly lower binge-drinking prevalence, but the relationship is not strong. This suggests that income alone does not explain differences in binge-drinking prevalence.

## Conclusion

Our visualizations show that there is a strong negative linear correlation in the relation between income and drinking. Geographic and socioeconomic patterns may help explain some of these differences, but additional factors such as age, education, healthcare access, and urban or rural location should also be considered.

## Notebook

[View the complete Jupyter notebook](https://github.com/ucd-cosmos-data/26-the-deep-learners/blob/main/content/logs/dataviz/data_viz_executed.ipynb)
