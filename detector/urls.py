from django.urls import path
from . import views


urlpatterns = [

    path(
        "",
        views.home,
        name="home"
    ),


    path(
        "save-analysis/",
        views.save_analysis,
        name="save_analysis"
    ),

]