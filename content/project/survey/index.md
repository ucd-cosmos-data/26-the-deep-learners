---
title: "Test"

---
# Survey Design


# Data Cleaning
## Handling Missing Values
  ```python
    df.isna().sum().head()
  ```
   - no missing values were found
## Handling Duplicates
  ```python
    df_cleaned = df.drop_duplicates(subset=['Email Address'])
  ```
   - removed partial duplicates based on email address

## Correct Structural Errors
  ```python
    df_cleaned = df.rename(columns={'What gender are you?': 'gender', 'How much do you like rap (music genre) on scale of 1 to 10?': 'rap', 'How much do you like pop (music genre) on a scale of 1 to 10?': 'pop'})
    df_cleaned
  ```
  - rename the columns from questions to actual variables

## Encode Categorical Variables
```python
    df_cleaned['gender'] = (df_cleaned['gender'] == 'Male').astype(int)
    df_cleaned = df_cleaned.drop(columns=['Timestamp'])
    df_cleaned
```
  - Use binary encoding for gender (male is 1, female is 0)

### then, we exported to a csv