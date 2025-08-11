#!/usr/bin/env python3
"""
Script para verificar la configuración de FCOS en el backend
"""

import os
import sys
from pathlib import Path

def check_fcos_files():
    """Verifica que todos los archivos necesarios de FCOS estén presentes"""
    
    print("🔍 Verificando archivos necesarios para FCOS...")
    
    # Rutas base
    current_dir = Path(__file__).parent
    fcos_dir = current_dir.parent / "FCOS" / "AdelaiDet"
    
    required_files = [
        # Archivos de configuración
        fcos_dir / "configs" / "FCOS-Detection" / "Base-FCOS.yaml",
        fcos_dir / "configs" / "FCOS-Detection" / "expiry_dates_R_50_1x.yaml",
        fcos_dir / "configs" / "FCOS-Detection" / "R_50_1x.yaml",
        
        # Modelo entrenado
        fcos_dir / "output" / "fcos" / "expiry_dates_R_50_1x" / "model_final.pth",
        
        # Archivos de código necesarios
        fcos_dir / "adet" / "config" / "__init__.py",
        fcos_dir / "demo" / "predictor.py",
        fcos_dir / "adet" / "modeling" / "fcos" / "fcos.py",
    ]
    
    missing_files = []
    existing_files = []
    
    for file_path in required_files:
        if file_path.exists():
            existing_files.append(file_path)
            print(f"✅ {file_path}")
        else:
            missing_files.append(file_path)
            print(f"❌ {file_path}")
    
    print(f"\n📊 Resumen:")
    print(f"   - Archivos encontrados: {len(existing_files)}")
    print(f"   - Archivos faltantes: {len(missing_files)}")
    
    if missing_files:
        print(f"\n⚠️  Archivos faltantes:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    return True

def check_dependencies():
    """Verifica que las dependencias estén instaladas"""
    
    print("\n🔍 Verificando dependencias...")
    
    required_packages = [
        "torch",
        "torchvision", 
        "cv2",
        "numpy",
        "PIL",
        "detectron2",
        "fvcore",
        "pycocotools"
    ]
    
    missing_packages = []
    existing_packages = []
    
    for package in required_packages:
        try:
            if package == "cv2":
                import cv2
            elif package == "PIL":
                import PIL
            else:
                __import__(package)
            existing_packages.append(package)
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    print(f"\n📊 Resumen de dependencias:")
    print(f"   - Paquetes instalados: {len(existing_packages)}")
    print(f"   - Paquetes faltantes: {len(missing_packages)}")
    
    if missing_packages:
        print(f"\n⚠️  Paquetes faltantes:")
        for package in missing_packages:
            print(f"   - {package}")
        return False
    
    return True

def test_fcos_import():
    """Prueba la importación de FCOS"""
    
    print("\n🔍 Probando importación de FCOS...")
    
    try:
        # Agregar FCOS al path
        current_dir = Path(__file__).parent
        fcos_dir = current_dir.parent / "FCOS" / "AdelaiDet"
        sys.path.append(str(fcos_dir))
        
        # Intentar importar
        from adet.config import get_cfg
        from demo.predictor import VisualizationDemo
        from adet.modeling.fcos import FCOS
        
        print("✅ Importaciones de FCOS exitosas")
        return True
        
    except Exception as e:
        print(f"❌ Error al importar FCOS: {e}")
        return False

def test_fcos_service():
    """Prueba el servicio FCOS"""
    
    print("\n🔍 Probando servicio FCOS...")
    
    try:
        from fcos_service import FCOSDetectionService
        
        # Intentar crear el servicio
        service = FCOSDetectionService()
        print("✅ Servicio FCOS creado exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error al crear servicio FCOS: {e}")
        return False

def main():
    """Función principal de verificación"""
    
    print("🚀 Verificación completa de configuración FCOS")
    print("=" * 50)
    
    # Verificar archivos
    files_ok = check_fcos_files()
    
    # Verificar dependencias
    deps_ok = check_dependencies()
    
    # Probar importaciones
    import_ok = test_fcos_import()
    
    # Probar servicio
    service_ok = test_fcos_service()
    
    print("\n" + "=" * 50)
    print("📋 RESUMEN FINAL")
    print("=" * 50)
    
    if all([files_ok, deps_ok, import_ok, service_ok]):
        print("🎉 ¡Todo está configurado correctamente!")
        print("✅ Puedes usar FCOS en tu backend")
    else:
        print("⚠️  Hay problemas en la configuración:")
        if not files_ok:
            print("   - Faltan archivos de FCOS")
        if not deps_ok:
            print("   - Faltan dependencias")
        if not import_ok:
            print("   - Problemas de importación")
        if not service_ok:
            print("   - Problemas con el servicio")
        
        print("\n💡 Soluciones:")
        print("   1. Instala las dependencias: pip install -r requirements.txt")
        print("   2. Asegúrate de que el modelo esté entrenado")
        print("   3. Verifica las rutas de los archivos")

if __name__ == "__main__":
    main() 