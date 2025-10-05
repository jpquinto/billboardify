def get_questions():
    """
    Returns the list of question-SQL training examples.
    
    Returns:
        list: List of dictionaries containing 'question' and 'sql' keys
    """
    examples = [
        {
            "question": "What are the top 10 most played tracks in September 2025?",
            "sql": """
                SELECT 
                    track_name,
                    artist_name,
                    album_name,
                    SUM(daily_play_count) AS total_plays,
                    album_cover_url
                FROM 
                    daily_track_aggregates
                WHERE 
                    date >= '2025-09-01' 
                    AND date < '2025-10-01'
                GROUP BY 
                    track_id,
                    track_name,
                    artist_name,
                    album_name,
                    album_cover_url
                ORDER BY 
                    total_plays DESC
                LIMIT 10;
            """
        },
        {
            "question": "How many unique tracks did I listen to over the last month?",
            "sql": """
                SELECT 
                    COUNT(DISTINCT track_id) AS count
                FROM 
                    daily_track_aggregates
                WHERE 
                    date >= CURRENT_DATE - INTERVAL '1 month'
                    AND date <= CURRENT_DATE;
            """
        },
        {
            "question": "What are my top 5 most played Drake songs over the last 30 days?",
            "sql": """
                SELECT 
                    track_name,
                    artist_name,
                    album_name,
                    SUM(daily_play_count) AS total_plays,
                    album_cover_url
                FROM 
                    daily_track_aggregates
                WHERE 
                    date >= CURRENT_DATE - INTERVAL '30 days'
                    AND date <= CURRENT_DATE
                    AND artist_name ILIKE '%Drake%'
                GROUP BY 
                    track_id,
                    track_name,
                    artist_name,
                    album_name,
                    album_cover_url
                ORDER BY 
                    total_plays DESC
                LIMIT 5;
            """
        },
        {
            "question": "What were my most played albums over the last 30 days?",
            "sql": """
                SELECT 
                    album_name,
                    artist_name,
                    SUM(daily_play_count) AS total_plays,
                    album_cover_url
                FROM 
                    daily_album_aggregates
                WHERE 
                    date >= CURRENT_DATE - INTERVAL '30 days'
                    AND date <= CURRENT_DATE
                GROUP BY 
                    album_id,
                    album_name,
                    artist_name,
                    album_cover_url
                ORDER BY 
                    total_plays DESC
                LIMIT 10;
            """
        },
        {
            "question": "Who were my top artists over the last 30 days?",
            "sql": """
                SELECT 
                    artist_name,
                    genre,
                    SUM(daily_play_count) AS total_plays,
                    artist_image_url
                FROM 
                    daily_artist_aggregates
                WHERE 
                    date >= CURRENT_DATE - INTERVAL '30 days'
                    AND date <= CURRENT_DATE
                GROUP BY 
                    artist_id,
                    artist_name,
                    genre,
                    artist_image_url
                ORDER BY 
                    total_plays DESC
                LIMIT 10;
            """
        },
        {
            "question": "How many unique artists did I listen to over the last week?",
            "sql": """
                SELECT 
                    COUNT(DISTINCT artist_id) AS count
                FROM 
                    daily_artist_aggregates
                WHERE 
                    date >= CURRENT_DATE - INTERVAL '7 days'
                    AND date <= CURRENT_DATE;
            """
        },
        {
            "question": "What k-pop artists did I listen to the most in 2024?",
            "sql": """
                SELECT 
                    artist_name,
                    genre,
                    yearly_play_count AS total_plays,
                    artist_image_url
                FROM 
                    yearly_artist_aggregates
                WHERE 
                    year = 2024
                    AND genre ILIKE '%k-pop%'
                ORDER BY 
                    yearly_play_count DESC
                LIMIT 10;
            """
        },
        {
            "question": "Show me my listening trends for The Weeknd over the last 3 months by month",
            "sql": """
                SELECT 
                    year_month,
                    artist_name,
                    monthly_play_count AS total_plays
                FROM 
                    monthly_artist_aggregates
                WHERE 
                    year_month >= TO_CHAR(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM')
                    AND year_month <= TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                    AND artist_name ILIKE '%The Weeknd%'
                ORDER BY 
                    year_month DESC;
            """
        },
        {
            "question": "What was my most played song in October 2025?",
            "sql": """
                SELECT 
                    track_name,
                    artist_name,
                    album_name,
                    SUM(daily_play_count) AS total_plays,
                    album_cover_url
                FROM 
                    daily_track_aggregates
                WHERE 
                    date >= '2025-10-01'
                    AND date < '2025-11-01'
                GROUP BY 
                    track_id,
                    track_name,
                    artist_name,
                    album_name,
                    album_cover_url
                ORDER BY 
                    total_plays DESC
                LIMIT 1;
            """
        },
        {
            "question": "How many times did I listen to music yesterday?",
            "sql": """
                SELECT 
                    SUM(daily_play_count) AS total_plays
                FROM 
                    daily_track_aggregates
                WHERE 
                    date = CURRENT_DATE - INTERVAL '1 day';
            """
        },
        {
            "question": "What genres did I listen to most in 2024?",
            "sql": """
                SELECT 
                    genre,
                    SUM(yearly_play_count) AS total_plays
                FROM 
                    yearly_artist_aggregates
                WHERE 
                    year = 2024
                    AND genre IS NOT NULL
                GROUP BY 
                    genre
                ORDER BY 
                    total_plays DESC
                LIMIT 10;
            """
        },
        {
            "question": "Which albums from aespa did I play the most this year?",
            "sql": """
                SELECT 
                    album_name,
                    artist_name,
                    SUM(monthly_play_count) AS total_plays,
                    album_cover_url
                FROM 
                    monthly_album_aggregates
                WHERE 
                    EXTRACT(YEAR FROM TO_DATE(year_month || '-01', 'YYYY-MM-DD')) = EXTRACT(YEAR FROM CURRENT_DATE)
                    AND artist_name ILIKE '%aespa%'
                GROUP BY 
                    album_id,
                    album_name,
                    artist_name,
                    album_cover_url
                ORDER BY 
                    total_plays DESC;
            """
        },
        {
            "question": "Compare my listening between this month and last month",
            "sql": """
                SELECT 
                    year_month,
                    SUM(monthly_play_count) AS total_plays
                FROM 
                    monthly_track_aggregates
                WHERE 
                    year_month IN (
                        TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
                        TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
                    )
                GROUP BY 
                    year_month
                ORDER BY 
                    year_month DESC;
            """
        },
        {
            "question": "What day did I listen to the most music last week?",
            "sql": """
                SELECT 
                    date,
                    SUM(daily_play_count) AS total_plays
                FROM 
                    daily_track_aggregates
                WHERE 
                    date >= CURRENT_DATE - INTERVAL '7 days'
                    AND date < CURRENT_DATE
                GROUP BY 
                    date
                ORDER BY 
                    total_plays DESC
                LIMIT 1;
            """
        }
    ]
    
    return examples