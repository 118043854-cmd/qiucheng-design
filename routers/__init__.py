# -*- coding: utf-8 -*-
from fastapi import APIRouter
from routers import main_image, detail, remix, matting, watermark, retouch, reference, settings

router = APIRouter()
