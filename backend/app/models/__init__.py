# Models package — import all models so Alembic can discover them.
from app.models.user import User  # noqa: F401
from app.models.event import Event  # noqa: F401
from app.models.registration import Registration  # noqa: F401
from app.models.weather import WeatherRecord  # noqa: F401
from app.models.prediction import Prediction  # noqa: F401
from app.models.model_evaluation import ModelEvaluation  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.activity import Activity  # noqa: F401
from app.models.task import Task  # noqa: F401
from app.models.report import Report  # noqa: F401
