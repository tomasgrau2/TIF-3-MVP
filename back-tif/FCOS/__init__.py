# FCOS Package for Backend Integration
# This package contains the essential files for FCOS object detection

__version__ = "1.0.0"
__author__ = "TIF3 Backend"

# Import essential modules
try:
    from .adet.config import get_cfg
    from .demo.predictor import VisualizationDemo
    from .adet.modeling.fcos import FCOS
except ImportError as e:
    print(f"Warning: Could not import FCOS modules: {e}")

# Package information
PACKAGE_INFO = {
    "name": "FCOS Backend Integration",
    "version": __version__,
    "description": "FCOS object detection for date recognition in backend",
    "config_path": "configs/FCOS-Detection/expiry_dates_R_50_1x.yaml",
    "model_path": "output/fcos/expiry_dates_R_50_1x/model_final.pth"
} 