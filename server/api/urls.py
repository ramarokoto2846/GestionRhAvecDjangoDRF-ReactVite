# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterViewSet, DepartementViewSet, EmployeViewSet, 
    PointageViewSet, AbsenceViewSet, CongeViewSet, EvenementViewSet, CurrentUserView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('departements', DepartementViewSet)
router.register('employes', EmployeViewSet)
router.register('pointages', PointageViewSet)
router.register('absences', AbsenceViewSet)
router.register('conges', CongeViewSet)
router.register('evenements', EvenementViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', CurrentUserView.as_view(), name='current-user'),
]