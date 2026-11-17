from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tracker.views import TransactionViewSet, DashboardView, AnalyticsView, PreferenceView, ResetDataView

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('settings/', PreferenceView.as_view(), name='settings'),
    path('settings/reset/', ResetDataView.as_view(), name='settings-reset'),
    path('', include(router.urls)),
]
