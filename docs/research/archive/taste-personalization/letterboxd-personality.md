# Letterboxd Personality Type. Classifying Your Movie Watching Habits… | by Alfian Hakim | Medium

**Source**: https://medium.com/@alf.19x/letterboxd-personality-type-7de953e468cc

---

Letterboxd Personality Type. Classifying Your Movie Watching Habits… | by Alfian Hakim | Medium

Sitemap

Open in app

Sign up

Sign in

Medium Logo

Get app

Write

Search

Sign up

Sign in

# Letterboxd Personality Type

## Classifying Your Movie Watching Habits Through Your Letterboxd Diaries

Alfian Hakim

9 min read

Feb 14, 2025

--

1

Listen

Share

Press enter or click to view image in full size

It’s been almost two years since I last wrote about Letterboxd. Back then, I focused on the basics, like analyzing profiles using standard descriptive stats — think release years, top genres, favorite directors, and so on. If you missed it, you can check out that article here, or take my analyzer app for a spin here.

Since then, I’ve been itching to dig deeper into Letterboxd data, but life kept getting in the way. Finally, in mid-January this year, I dedicated two weekends to crunching the numbers. With Letterboxd dropping its own version of “Wrapped” (or Year in Review) at the start of January, I was super excited to dive into this project. My goal? To create my own version of “Wrapped,” inspired by the awesomeness of Spotify Wrapped 2022.

The top page of my Year in Review by Letterboxd

## The Inspiration

If you’re into Spotify and look forward to your Wrapped each year, you might recall that in 2022, Spotify Wrapped introduced something called the Listening Personality. It was a bit like the MBTI for music, breaking down listening habits into four aspects, which resulted in 16 personality types.

Press enter or click to view image in full size

Spotify Listening Personality

I found this feature pretty fascinating — I discovered I was “The Time Traveler” type. Unfortunately, they removed it the following year, which was a bit disappointing. Here’s a brief overview of those Listening Personality aspects:

- Commonality vs. Uniqueness: Are your songs widely popular, or is your taste unique?
- Loyalty vs. Variety: Do you replay the same songs, or is your playlist diverse?
- Timelessness vs. Newness: Are your favorite songs classics, or are they recent hits?
- Familiarity vs. Exploration: Do you stick with familiar artists, or do you explore new ones?

You can find more details about each aspect on this Spotify R&D page.

Inspired by this, I wanted to apply similar ideas to movie-watching habits. Of course, watching movies and listening to music are quite different. A song is typically 3–5 minutes long, while a movie can be 1–2 hours. Plus, we often replay songs we like, but rewatching movies isn’t as common. So, I decided to adapt two aspects: Timelessness vs. Newness and Commonality vs. Uniqueness.

## The Idea

After chatting with ChatGPT, I finally came up with my own set of aspects to define a movie-watching personality. There are nine aspects — yeah, it might seem like a lot, but why not?

### Critic vs Appreciator

This is unique to Letterboxd because of its rating system, which Spotify doesn’t have. Users can rate movies from 0.5 to 5 stars. By comparing your ratings to the average, you can see if you tend to rate higher or lower. For instance, I gave Barbie (2023) a solid 5 stars, while the average is 3.8. This makes me an “Appreciator.”

### Recent vs Timeless

Borrowing from Spotify’s Listening Personality, if you mostly watch movies released in recent years, you’re “Recent.” But if you’re into classics from the ’70s, ’80s, or even earlier, you’re “Timeless.”

### Obscure vs Popular

Another aspect inspired by Spotify. If you watch films that aren’t on many other Letterboxd users’ radars, you’re “Obscure.”

### Logger vs Reviewer

Thanks to Letterboxd’s review feature, we can see who’s writing reviews and who’s just logging their watches. I’m more of a “Logger” since I tend to just note what I’ve watched without reviewing.

### One-Timer vs Rewatcher

Some folks are good with watching a movie just once, while others love rewatching favorites. Letterboxd lets you log rewatches, so if you’re using this feature a lot, you’re a “Rewatcher.”

### Genre Loyalist vs Genre Explorer

Pretty straightforward — if you stick to specific genres, you’re a “Genre Loyalist.”

### Theme Loyalist vs Theme Explorer

Besides genres, Letterboxd also has themes for movies. If you watch films with various themes, you’re a “Theme Explorer.”

### Country Loyalist vs Country Explorer

Some people stick to Hollywood films, while others enjoy exploring indie gems from places like Denmark or Iran.

### Language Loyalist vs Language Explorer

Some folks are all about subtitles, while others prefer not to use them.

## The Classification Process

To figure out the standard thresholds that separate different Letterboxd user types, we first needed to decide which metrics to focus on. This meant taking a sample of Letterboxd users to analyze. I gathered around 200–300 samples from users who used my Letterboxd Profile Analyzer app. For this analysis, I focused solely on the movies they logged in 2024.

Press enter or click to view image in full size

Data Preview

Interestingly, half of these Letterboxd users logged fewer than 97 movies in 2024, which averages out to about 8 movies per month. I was pretty surprised by this because I only logged 66 movies myself! This really shows how much of a cinephile community Letterboxd is — people are watching a ton of movies. There was even one user in my sample who logged 800 movies last year. That’s a wild number!

Now that we’ve got our sample set, let’s dive into the metrics for each aspect.

### Critic vs Appreciator

For this aspect, one key metric is the average rating gap. It’s calculated by taking the average rating a user gives and subtracting the average rating given by all Letterboxd users for the same movies. Another important metric is the average likeability ratio gap. This ratio measures the number of movies a user likes compared to the total number they’ve watched, and then compares it to the average likeability ratio for those same movies.

For instance, if I’ve watched 66 movies and liked 27 of them, my likeability rate is 27%. If the average likeability for those movies among all users is 33%, my likeability ratio gap is -6%. This gap helps identify users who tend to like movies more than average, classifying them as “Appreciators.”

Press enter or click to view image in full size

Rating Gap and Likeability Gap Distribution

Looking at the rating gap, it appears to be normally distributed, with most people having almost no gap. The likeability ratio gap is slightly right-skewed, but not drastically so. To determine a final Critic/Appreciator score, I’ll use a simple method: calculate the percentile rank for both metrics, then average them. For example, if my average rating gap is 0.4 (79th percentile) and my likeability ratio gap is -0.06 (45th percentile), my final score is (79+45)/2 = 62. Since my score is above 50, I’m classified as an “Appreciator.”

### Recent vs Timeless

For this aspect, I’ll focus on two metrics: the mean movie release year gap to 2024 and the median movie release year gap to 2024.

Press enter or click to view image in full size

Mean Release Year Gap and Median Release Year Gap Distribution

I was quite surprised by the distribution here — it turns out a lot of Letterboxd users are really into exploring older films. To determine the final score, I’ll average the percentile ranks of these two metrics. For example, if my mean release year is 2012 (a 12-year gap from 2024, putting me in the 27th percentile) and my median release year is 2019 (a 5-year gap from 2024, in the 18th percentile), my final score would be (27+18)/2 = 22.5. This classifies me as a “Recent” movie watcher.

### Obscure vs Popular

For this aspect, we’re looking at two metrics: the mean number of watches and the median number of watches for the movies a user has seen.

Press enter or click to view image in full size

Mean Number of Watches and Median Number of Watches Distribution

It’s important to note that whether a movie is considered obscure or popular is based solely on the number of watches on Letterboxd. This can introduce some bias since most Letterboxd users are from the US. Movies that are popular in other countries might not show up as popular on Letterboxd simply because there aren’t many users from those regions.

Number of watches of Her (2013) on Letterboxd page

As with the other aspects, the final Obscure/Popular score is calculated by averaging the percentile ranks of the mean and median number of watches. For instance, if my mean number of watches is 628,776 (33rd percentile) and my median number of watches is 262,860 (30th percentile), my final score would be (33+30)/2 = 31.5. This would classify me as an “Obscure” movie watcher.

### Logger vs Reviewer & One-Timer vs Rewatcher

For these two aspects, I’m using one metric each: review rate and rewatch rate. The review rate distribution resembles a U-shape but is still right-skewed, indicating that there are many users who either rarely write reviews or don’t write any at all. On the other hand, the rewatch rate is very right-skewed, with most users having a 0–30% rewatch rate, suggesting that people don’t often rewatch movies.

Press enter or click to view image in full size

Review Rate and Rewatch Rate Distribution

Since I didn’t write any reviews in 2024, I end up with the lowest percentile rank of 0. I rewatched 2 out of the 66 movies I logged, which gives me about a 3% rewatch rate, placing me in the 28th percentile. Based on these percentile ranks, I’m classified as a “Logger” and a “One-Timer.”

### Explorer vs Loyalist

For the four aspects of explorer vs loyalist (genre, theme, country, language), I use the Shannon Entropy method, which I learned about after chatting with ChatGPT.

Press enter or click to view image in full size

Shannon Entropy Formula

ChatGPT suggested calculating the Shannon Entropy for each category and then subtracting the dominant category ratio. For example, my final genre explorer score is 5.06, which places me in the 58th percentile, classifying me as a Genre Explorer. This score comes from an entropy of 5.59 minus my dominant genre ratio of 0.53. Curious about how I got these numbers? Let me show you my genre distribution compared to users with higher and lower genre explorer scores than mine.

Press enter or click to view image in full size

My Genre Distribution Compared to a Loyalist and an Explorer

From the chart, you can visually see that an explorer’s genre distribution is more balanced, while a loyalist’s is more skewed. Shannon Entropy effectively captures the balance in categorical distribution.

Press enter or click to view image in full size

My Genre Entropy Calculation

In the table above, you can see how the entropy is calculated from the proportion values of my genres: 34.8% corresponds to 0.53 entropy, 15.2% to 0.41, and so on. The sum of all entropies is then subtracted by the dominant genre proportion to get a final score of 5.06, which is in the 58th percentile.

Press enter or click to view image in full size

Genre Explorer Score, Theme Explorer Score, Country Explorer Score, Language Explorer Score Distribution

Typically, genre explorer scores range from 3 to 6. Since there are more themes than genres, it’s logical that theme explorer scores are higher, ranging from 8 to 24. country explorer and language explorer scores have similar distributions, ranging from 0 to 5. My theme explorer score is 16.5, placing me in the 28th percentile, while my country explorer score is 2.02 (54th percentile), and my language explorer score is 2.51 (60th percentile). So, in the end, I’m classified as a Genre Explorer, Theme Loyalist, Country Explorer, and Language Explorer.

## The Final Product

Inspired by Spotify Wrapped, I wanted to create a 9x16 image that people could share on their Instagram stories. Initially, I considered making a slider or bar plot visualization, but then I realized that would require more effor
