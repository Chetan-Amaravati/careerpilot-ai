import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# 1. Add project root to sys.path so we can import 'app' module
# This ensures that when running alembic from 'backend/' folder, it can resolve 'app.core.config'
sys.path.insert(0, ".")

from app.core.config import settings
from app.core.database import Base
from app.models import (
    User, Resume, JobDescription, AnalysisResult, Assessment,
    Question, AssessmentAttempt, InterviewAttempt, InterviewQuestion,
    LearningProgress, Notification
)

# 2. This is the Alembic Config object, which provides access to values within the .ini file in use.
config = context.config

# 3. Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 4. Set the sqlalchemy.url dynamically using our settings
# This avoids hardcoding DB credentials in alembic.ini!
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# 5. Set target_metadata for autogenerate support
# By linking Base.metadata, Alembic can compare the current state of database tables
# with the SQLAlchemy classes defined in python and auto-generate schema diffs.
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation we don't even need the DB API to be installed.

    Calls to context.execute() here emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to associate a connection with the context.
    """
    # Create database engine from config settings
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
