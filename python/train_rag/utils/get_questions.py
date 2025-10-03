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
    ]
    
    return examples