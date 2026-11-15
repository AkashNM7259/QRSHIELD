"""
Unified Test Runner for QRShield Backend.
Executes all test suites and prints detailed pass/fail forensics.
"""

import sys
from pathlib import Path
import unittest

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

def run_tests():
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=str(backend_dir / 'tests'), pattern='test_*.py')
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)

