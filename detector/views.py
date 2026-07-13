from django.shortcuts import render

def home(request):
    return render(request, "index.html")

from django.http import JsonResponse
from .models import FaceAnalysis
import json


def save_analysis(request):

    if request.method == "POST":

        data = json.loads(request.body)


        analysis = FaceAnalysis.objects.create(
            age=data.get("age"),
            gender=data.get("gender"),
            emotion=data.get("emotion")
        )


        return JsonResponse({
            "status": "saved",
            "id": analysis.id
        })


    return JsonResponse({
        "error": "Invalid request"
    })