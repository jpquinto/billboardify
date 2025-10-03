def get_ddls():
    """
    Returns the list of DDL training examples.
    
    Returns:
        list: List of strings containing DDL statements
    """
    examples = [
        """
            CREATE TABLE IF NOT EXISTS daily_track_aggregates (
                date DATE NOT NULL,
                track_id VARCHAR(255) NOT NULL,
                artist_id VARCHAR(255) NOT NULL,
                album_id VARCHAR(255) NOT NULL,
                daily_play_count INTEGER DEFAULT 0,
                track_name VARCHAR(500) NOT NULL DEFAULT '',
                artist_name VARCHAR(500) NOT NULL DEFAULT '',
                album_name VARCHAR(500) NOT NULL DEFAULT '',
                album_cover_url TEXT NOT NULL,
                PRIMARY KEY (date, track_id)
            );
        """,
        """
            CREATE TABLE IF NOT EXISTS daily_artist_aggregates (
                date DATE NOT NULL,
                artist_id VARCHAR(255) NOT NULL,
                daily_play_count INTEGER DEFAULT 0,
                genre VARCHAR(255) NULL,
                artist_name VARCHAR(500) NOT NULL DEFAULT '',
                artist_image_url TEXT NOT NULL,
                PRIMARY KEY (date, artist_id)
            );
        """,
        """
            CREATE TABLE IF NOT EXISTS daily_album_aggregates (
                date DATE NOT NULL,
                album_id VARCHAR(255) NOT NULL,
                artist_id VARCHAR(255) NOT NULL,
                daily_play_count INTEGER DEFAULT 0,
                album_name VARCHAR(500) NOT NULL DEFAULT '',
                artist_name VARCHAR(500) NOT NULL DEFAULT '',
                album_cover_url TEXT NOT NULL,
                PRIMARY KEY (date, album_id)
            );
        """,
        """
            CREATE TABLE IF NOT EXISTS monthly_track_aggregates (
                year_month VARCHAR(7) NOT NULL,
                track_id VARCHAR(255) NOT NULL,
                artist_id VARCHAR(255) NOT NULL,
                album_id VARCHAR(255) NOT NULL,
                monthly_play_count INTEGER DEFAULT 0,
                track_name VARCHAR(500) NOT NULL DEFAULT '',
                artist_name VARCHAR(500) NOT NULL DEFAULT '',
                album_name VARCHAR(500) NOT NULL DEFAULT '',
                album_cover_url TEXT NOT NULL,
                PRIMARY KEY (year_month, track_id)
            );
        """,
        """
            CREATE TABLE IF NOT EXISTS monthly_artist_aggregates (
                year_month VARCHAR(7) NOT NULL,
                artist_id VARCHAR(255) NOT NULL,
                monthly_play_count INTEGER DEFAULT 0,
                genre VARCHAR(255) NULL,
                artist_name VARCHAR(500) NOT NULL DEFAULT '',
                artist_image_url TEXT NOT NULL,
                PRIMARY KEY (year_month, artist_id)
            );
        """,
        """
            CREATE TABLE IF NOT EXISTS monthly_album_aggregates (
                year_month VARCHAR(7) NOT NULL,
                album_id VARCHAR(255) NOT NULL,
                artist_id VARCHAR(255) NOT NULL,
                monthly_play_count INTEGER DEFAULT 0,
                album_name VARCHAR(500) NOT NULL DEFAULT '',
                artist_name VARCHAR(500) NOT NULL DEFAULT '',
                album_cover_url TEXT NOT NULL,
                PRIMARY KEY (year_month, album_id)
            );
        """,
        """
            CREATE TABLE IF NOT EXISTS yearly_track_aggregates (
                year INTEGER NOT NULL,
                track_id VARCHAR(255) NOT NULL,
                artist_id VARCHAR(255) NOT NULL,
                album_id VARCHAR(255) NOT NULL,
                yearly_play_count INTEGER DEFAULT 0,
                track_name VARCHAR(500) NOT NULL DEFAULT '',
                artist_name VARCHAR(500) NOT NULL DEFAULT '',
                album_name VARCHAR(500) NOT NULL DEFAULT '',
                album_cover_url TEXT NOT NULL,
                PRIMARY KEY (year, track_id)
            );
        """,
        """
            CREATE TABLE IF NOT EXISTS yearly_artist_aggregates (
                year INTEGER NOT NULL,
                artist_id VARCHAR(255) NOT NULL,
                yearly_play_count INTEGER DEFAULT 0,
                genre VARCHAR(255) NULL,
                artist_name VARCHAR(500) NOT NULL DEFAULT '',
                artist_image_url TEXT NOT NULL,
                PRIMARY KEY (year, artist_id)
            );
        """,
        """
            CREATE TABLE IF NOT EXISTS yearly_album_aggregates (
                year INTEGER NOT NULL,
                album_id VARCHAR(255) NOT NULL,
                artist_id VARCHAR(255) NOT NULL,
                yearly_play_count INTEGER DEFAULT 0,
                album_name VARCHAR(500) NOT NULL DEFAULT '',
                artist_name VARCHAR(500) NOT NULL DEFAULT '',
                album_cover_url TEXT NOT NULL,
                PRIMARY KEY (year, album_id)
            );
        """
    ]
    
    return examples