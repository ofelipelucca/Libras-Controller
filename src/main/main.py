from src.logger.logger import Logger
from src.mainloop.mainloop import MainLoop
import ctypes   
import asyncio  
import sys

logger = Logger.configure_application_logger()
error_logger = Logger.configure_error_logger()

async def main(data_port, frames_port) -> None:
    logger.info("Iniciando LibrasController...")

    app_id = 'felipelucca.libras.controller.1.0'
    ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(app_id)

    try:
        main_loop = MainLoop(data_port, frames_port)
        main_loop.start()
    except Exception as e:
        error_message = f"LibrasController: {e}"
        logger.error(error_message)
        error_logger.error(error_message)
    finally:
        main_loop.stop()
        logger.info("LibrasController encerrado.")

if __name__ == "__main__":
    port1 = int(sys.argv[1])  
    port2 = int(sys.argv[2])
    
    asyncio.run(main(port1, port2))