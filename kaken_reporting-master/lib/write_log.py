import logging
import time
 
# from logging.handlers import TimedRotatingFileHandler, RotatingFileHandler, FileHandler
from logging import FileHandler


def write_error_log(name, log_name, _mode="w"):
    logger = logging.getLogger(log_name)
    logger.setLevel(logging.DEBUG)     

    # handler = TimedRotatingFileHandler(name,
    #                                 when="s",
    #                                 interval=10,
    #                                 backupCount=5)


    handler = FileHandler(name, mode = _mode)

    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    logger.addHandler(handler)
 

# class create_timed_rotating_log:
#     def __init__(self, name, log_name):
#         self.logger = logging.getLogger(log_name)
#         self.logger.setLevel(logging.DEBUG)     

#         handler = TimedRotatingFileHandler(name,
#                                         when="s",
#                                         interval=10,
#                                         backupCount=5)

#         formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
#         handler.setFormatter(formatter)

#         self.logger.addHandler(handler)

# if __name__ == "__main__":
#     logger_err = create_timed_rotating_log("error log","error")
#     try:
#         open('/path/to/does/not/exist', 'rb')
#     except Exception as  e:
#         print("test")
#         logger_err.logger.error('Failed to open file', exc_info=True)