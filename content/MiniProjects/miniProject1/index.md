---
title: "Mini Project #2: Exploring the Relation between Income and Binge Drinking"
---

## Overview

In this analysis, we explored health and socioeconomic differences among California counties. We created visualizations to examine the relationship between median household income and binge-drinking prevalence.

## Question
> Does the median household income and percentage of binge-drinkers in California counties have a correlation?

## Hypothesis
The counties that had higher and lower incomes would have higher rates of binge drinking compared to mid-income families. 

## Data Acquisition
Binge Drinking: https://data.cdc.gov/500-Cities-Places/PLACES-County-Data-GIS-Friendly-Format-2025-releas/i46a-9kgh/about_data 

Median Household Income: https://www.countyhealthrankings.org/health-data/community-conditions/social-and-economic-factors/income-employment-and-wealth/median-household-income?year=2025 

## Data Cleaning
- To clean our datasets we first had to filter for California counties in both. 
```python
cali_df = income_df[income_df['State'] == 'California']
```

- After this step for our median income data set we altered the county names so they would match the same formatting as the county names from the binge-drinking data set. 
```python
cali_df['County'] = cali_df['County'].apply(lambda x: x[:len(x)-7])
```

- Then for this data set we standardized the FIPS codes adding leading zero, so that there were the same amount of digits in each one. 
```python
cali_df['FIPS'] = cali_df['FIPS'].apply(lambda x: "0" + str(x))
```
- Once we did this we were able to merge the two data sets so we could compare the median income of each county the the rate of binge-drinking in each county. 
```python
df = pd.merge(cali_df, binge_ca, on='County')

df = df.loc[:, ['County', 'stateabbr', 'countyfips', 'BINGE_AdjPrev', 'Median Household Income']]
```
## Figures
<div id="fig-binge-drinking">
{{< include-html "HTMLs/binge_drinking_choropleth.html" "Figure 1 - Binge Drinking Choropleth" >}}
</div>
<div id="fig-income">
{{< include-html "HTMLs/median_household_income_choropleth.html" "Figure 2 - Household Income Choropleth" >}}
</div>
<div id="fig-scatterplot">
{{< include-html "HTMLs/scatterplot.html" "Figure 3 - Binge Drinking vs Median Household Income" >}}
</div>

## Analysis

The model [figure 3](#fig-scatterplot) in compares median household income with adjusted binge-drinking prevalence. Each point represents a California county.

The trendline suggests a weak negative linear relationship with out calculated correlation coefficient being equal to around -0.18. Counties with higher median household incomes tend to have slightly lower binge-drinking prevalence, but the relationship is not strong. This suggests that income alone does not explain differences in binge-drinking prevalence.

This trend seen in [figure 3](#fig-scatterplot) can also be corroborated by the models in [figure 1](#fig-binge-drinking) and [figure 2](#fig-income). While low income and binge drinking cases are more prevelant in certain counties, this is not this not the case in counties with higher incomes.  

## Conclusion

Our visualizations show that there is a weak negative linear correlation in the relation between income and drinking. Geographic and socioeconomic patterns may help explain some of these differences, but additional factors such as age, education, healthcare access, and urban or rural location should also be considered.
