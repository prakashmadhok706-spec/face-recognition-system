import subprocess
import time
import sys
import os
import test_face_enrollment_retrain

def main():
    print(">>> Starting FastAPI backend server in background...")
    backend_proc = subprocess.Popen(
        [sys.executable, "main.py"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    try:
        print(">>> Waiting for backend to become healthy...")
        time.sleep(2)
        test_face_enrollment_retrain.test_all()
        print("\n>>> All verification tests finished successfully!")
    finally:
        print(">>> Terminating test backend server...")
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()

if __name__ == "__main__":
    main()
