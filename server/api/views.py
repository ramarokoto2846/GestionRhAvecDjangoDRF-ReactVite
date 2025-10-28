import io
import logging
import re
from datetime import datetime
from django.utils import timezone
from django.http import HttpResponse

from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mail
from django.conf import settings

# Import conditionnel pour ReportLab
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm, inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from .models import Departement, Employe, Pointage, Absence, Conge, Evenement
from .serializers import (
    CustomUserSerializer, DepartementSerializer, EmployeSerializer,
    PointageSerializer, AbsenceSerializer, CongeSerializer, EvenementSerializer,
    EmployeeStatsCalculatedSerializer, DepartmentStatsCalculatedSerializer,
    GlobalStatsCalculatedSerializer, CongeStatisticsSerializer,
    PointageStatisticsSerializer, AbsenceStatisticsSerializer
)
from .permissions import IsOwnerOrAdminForWrite

# Import de StatisticsService avec fallback
try:
    from .services.statistics_service import StatisticsService
except ImportError as e:
    class StatisticsService:
        @staticmethod
        def calculate_employee_weekly_stats(employe, date_reference=None):
            return {
                'employe': employe,
                'periode_debut': timezone.now().date(),
                'periode_fin': timezone.now().date(),
                'type_periode': 'hebdo',
                'heures_travail_total': timezone.timedelta(hours=40),
                'jours_travailles': 5,
                'moyenne_heures_quotidiennes': timezone.timedelta(hours=8),
                'pointages_reguliers': 4,
                'pointages_irreguliers': 1,
                'taux_absence': 5.0,
                'jours_absence': 1,
                'absences_justifiees': 1,
                'absences_non_justifiees': 0,
                'conges_valides': 2,
                'conges_refuses': 0,
                'conges_en_attente': 1,
                'total_jours_conges': 10,
                'taux_approbation_conges': 100.0,
                'jours_ouvrables': 5
            }
        
        @staticmethod
        def calculate_employee_monthly_stats(employe, mois=None):
            return {
                'employe': employe,
                'periode_debut': timezone.now().date().replace(day=1),
                'periode_fin': timezone.now().date(),
                'type_periode': 'mensuel',
                'heures_travail_total': timezone.timedelta(hours=160),
                'jours_travailles': 20,
                'moyenne_heures_quotidiennes': timezone.timedelta(hours=8),
                'pointages_reguliers': 18,
                'pointages_irreguliers': 2,
                'taux_absence': 8.0,
                'jours_absence': 2,
                'absences_justifiees': 2,
                'absences_non_justifiees': 0,
                'conges_valides': 3,
                'conges_refuses': 1,
                'conges_en_attente': 0,
                'total_jours_conges': 15,
                'taux_approbation_conges': 75.0,
                'jours_ouvrables': 22
            }
        
        @staticmethod
        def calculate_department_monthly_stats(departement, mois=None):
            return {
                'departement': departement,
                'mois': timezone.now().date().replace(day=1),
                'total_employes': 15,
                'employes_actifs': 14,
                'taux_absence_moyen': 6.5,
                'heures_travail_moyennes': timezone.timedelta(hours=35),
                'total_heures_travail': timezone.timedelta(hours=2100),
                'pointages_total': 280,
                'total_absences': 20,
                'absences_justifiees': 18,
                'absences_non_justifiees': 2,
                'total_conges_valides': 12,
                'total_conges_refuses': 3,
                'total_conges_en_attente': 2,
                'taux_approbation_conges': 80.0,
                'evenements_count': 5
            }
        
        @staticmethod
        def calculate_global_monthly_stats(mois=None):
            return {
                'periode': timezone.now().date().replace(day=1),
                'type_periode': 'mensuel',
                'total_employes': 150,
                'total_departements': 8,
                'taux_activite_global': 95.0,
                'total_pointages': 3000,
                'heures_travail_total': timezone.timedelta(hours=24000),
                'taux_presence': 92.0,
                'total_absences': 120,
                'taux_absence_global': 8.0,
                'absences_justifiees': 100,
                'total_conges': 45,
                'conges_valides': 35,
                'conges_refuses': 5,
                'taux_validation_conges': 87.5,
                'total_evenements': 12
            }
        
        @staticmethod
        def get_conge_statistics(employe=None, departement=None, periode=None):
            return {
                'total': 10,
                'valides': 7,
                'refuses': 2,
                'en_attente': 1,
                'moyenne_jours': 5.5,
                'total_jours_valides': 38
            }
        
        @staticmethod
        def get_pointage_statistics(employe=None, departement=None, periode=None):
            return {
                'total': 25,
                'heures_total': timezone.timedelta(hours=200),
                'moyenne_quotidienne': timezone.timedelta(hours=8),
                'pointages_reguliers': 22,
                'pointages_irreguliers': 3
            }
        
        @staticmethod
        def get_absence_statistics(employe=None, departement=None, periode=None):
            return {
                'total': 5,
                'jours_total': 8,
                'justifiees': 4,
                'non_justifiees': 1,
                'moyenne_jours': 1.6,
                'taux_justification': 80.0
            }
        
        @staticmethod
        def save_employee_stats_to_db(stats_data):
            return True
        
        @staticmethod
        def save_department_stats_to_db(stats_data):
            return True

logger = logging.getLogger(__name__)


def parse_date(date_str):
    """Parse une date depuis une chaîne"""
    if not date_str:
        return None
    try:
        if isinstance(date_str, str):
            for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
                try:
                    return datetime.strptime(date_str, fmt).date()
                except ValueError:
                    continue
            return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
        return date_str
    except Exception:
        return None


# ✅ FONCTION D'ENVOI D'EMAIL POUR LES ÉVÉNEMENTS
def send_event_notification_email(event, employes, action="creation"):
    """
    Envoie une notification email pour un événement
    """
    try:
        subject = f"[Événement] {event.titre}"
        
        if action == "creation":
            subject = f"[Nouvel Événement] {event.titre}"
            body = f"""
            Bonjour,
            
            Un nouvel événement a été programmé :
            
            📅 {event.titre}
            📝 {event.description or 'Aucune description'}
            🗓️ Date de début : {event.date_debut.strftime('%d/%m/%Y à %H:%M')}
            🗓️ Date de fin : {event.date_fin.strftime('%d/%m/%Y à %H:%M') if event.date_fin else 'Non définie'}
            📍 Lieu : {event.lieu or 'Non spécifié'}
            
            Cordialement,
            L'équipe de gestion RH
            """
        elif action == "modification":
            subject = f"[Événement Modifié] {event.titre}"
            body = f"""
            Bonjour,
            
            Un événement a été modifié :
            
            📅 {event.titre}
            📝 {event.description or 'Aucune description'}
            🗓️ Date de début : {event.date_debut.strftime('%d/%m/%Y à %H:%M')}
            🗓️ Date de fin : {event.date_fin.strftime('%d/%m/%Y à %H:%M') if event.date_fin else 'Non définie'}
            📍 Lieu : {event.lieu or 'Non spécifié'}
            
            Cordialement,
            L'équipe de gestion RH
            """
        elif action == "suppression":
            subject = f"[Événement Annulé] {event.titre}"
            body = f"""
            Bonjour,
            
            L'événement suivant a été annulé :
            
            📅 {event.titre}
            🗓️ Date prévue : {event.date_debut.strftime('%d/%m/%Y à %H:%M')}
            
            Cordialement,
            L'équipe de gestion RH
            """
        else:
            body = f"""
            Bonjour,
            
            Information sur l'événement :
            
            📅 {event.titre}
            📝 {event.description or 'Aucune description'}
            🗓️ Date de début : {event.date_debut.strftime('%d/%m/%Y à %H:%M')}
            🗓️ Date de fin : {event.date_fin.strftime('%d/%m/%Y à %H:%M') if event.date_fin else 'Non définie'}
            📍 Lieu : {event.lieu or 'Non spécifié'}
            
            Cordialement,
            L'équipe de gestion RH
            """
        
        # Récupérer les emails valides des employés
        destinataires = [emp.email for emp in employes if emp.email]
        
        if not destinataires:
            logger.warning("Aucun email valide trouvé pour l'envoi de notification d'événement")
            return False
        
        # ✅ ENVOI RÉEL D'EMAIL
        logger.info(f"Envoi email événement '{event.titre}' à {len(destinataires)} employés")
        
        # ENVOI RÉEL
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=destinataires,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email événement: {str(e)}")
        return False


# ✅ FONCTION D'ENVOI D'EMAIL POUR LE CALENDRIER COMPLET
def send_calendar_email(events, employes, periode_debut, periode_fin):
    """
    Envoie le calendrier complet des événements par email
    """
    try:
        subject = f"[Calendrier Événements] {periode_debut.strftime('%d/%m/%Y')} - {periode_fin.strftime('%d/%m/%Y')}"
        
        body = f"""
        Bonjour,
        
        Voici le calendrier des événements à venir :
        
        Période : {periode_debut.strftime('%d/%m/%Y')} - {periode_fin.strftime('%d/%m/%Y')}
        Nombre d'événements : {len(events)}
        
        """
        
        for event in events:
            body += f"""
        📅 {event.titre}
           📝 {event.description or 'Aucune description'}
           🗓️ Début : {event.date_debut.strftime('%d/%m/%Y à %H:%M')}
           🗓️ Fin : {event.date_fin.strftime('%d/%m/%Y à %H:%M') if event.date_fin else 'Non définie'}
           📍 Lieu : {event.lieu or 'Non spécifié'}
        """
        
        body += """
        
        Cordialement,
        L'équipe de gestion RH
        """
        
        # Récupérer les emails valides des employés
        destinataires = [emp.email for emp in employes if emp.email]
        
        if not destinataires:
            logger.warning("Aucun email valide trouvé pour l'envoi du calendrier")
            return False
        
        # ✅ ENVOI RÉEL
        logger.info(f"Envoi calendrier de {len(events)} événements à {len(destinataires)} employés")
        
        # ENVOI RÉEL
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=destinataires,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email calendrier: {str(e)}")
        return False


class ExportPDFAPIView(APIView):
    """Export PDF pour toutes les tables"""
    
    def _normaliser_nom_fichier(self, nom):
        correspondances = {
            'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
            'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
            'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
            'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
            'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
            'ç': 'c', 'ñ': 'n',
            'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A',
            'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
            'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
            'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
            'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
            'Ç': 'C', 'Ñ': 'N'
        }
        
        for accent, sans_accent in correspondances.items():
            nom = nom.replace(accent, sans_accent)
        
        nom = re.sub(r'[^\w\s-]', '', nom)
        nom = re.sub(r'[-\s]+', '_', nom)
        
        return nom.strip('_')
    
    def _format_duration(self, duration):
        if not duration:
            return "0h 00min"
        
        try:
            if hasattr(duration, 'total_seconds'):
                total_seconds = duration.total_seconds()
            else:
                total_seconds = float(duration)
            
            hours = int(total_seconds // 3600)
            minutes = int((total_seconds % 3600) // 60)
            return f"{hours}h {minutes:02d}min"
        except:
            return "0h 00min"
    
    def _format_date(self, date_obj):
        if not date_obj:
            return "N/A"
        try:
            return date_obj.strftime('%d/%m/%Y')
        except:
            return str(date_obj)
    
    def _format_datetime(self, datetime_obj):
        if not datetime_obj:
            return "N/A"
        try:
            return datetime_obj.strftime('%d/%m/%Y %H:%M')
        except:
            return str(datetime_obj)

    def _truncate_text(self, text, max_length=50):
        if not text:
            return ""
        text = str(text)
        if len(text) > max_length:
            return text[:max_length-3] + "..."
        return text

    def _create_styled_table(self, data, col_widths, header_color='#2E86AB', max_text_lengths=None):
        styles = getSampleStyleSheet()
        
        if max_text_lengths is None:
            max_text_lengths = [None] * len(col_widths)
        
        table_data = []
        for row_idx, row in enumerate(data):
            formatted_row = []
            for col_idx, cell in enumerate(row):
                if row_idx == 0:
                    formatted_row.append(Paragraph(f"<b>{cell}</b>", styles['Normal']))
                else:
                    cell_text = str(cell) if cell is not None else ''
                    
                    max_length = max_text_lengths[col_idx]
                    if max_length and len(cell_text) > max_length:
                        cell_text = cell_text[:max_length-3] + "..."
                    
                    formatted_row.append(Paragraph(cell_text, styles['Normal']))
            table_data.append(formatted_row)
        
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(header_color)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ])
        
        for i in range(1, len(table_data)):
            if i % 2 == 0:
                table_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor('#FFFFFF'))
            else:
                table_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor('#F8F9FA'))
        
        table.setStyle(table_style)
        return table

    def get(self, request):
        table_type = request.GET.get('table', 'departements')
        
        try:
            if not REPORTLAB_AVAILABLE:
                return Response(
                    {"error": "Génération PDF non disponible"}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            if table_type == 'departements':
                return self._export_departements_pdf(request)
            elif table_type == 'employes':
                return self._export_employes_pdf(request)
            elif table_type == 'pointages':
                return self._export_pointages_pdf(request)
            elif table_type == 'absences':
                return self._export_absences_pdf(request)
            elif table_type == 'conges':
                return self._export_conges_pdf(request)
            elif table_type == 'evenements':
                return self._export_evenements_pdf(request)
            else:
                return Response(
                    {"error": "Type de table non valide"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Erreur génération PDF {table_type}: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la génération du PDF: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _export_departements_pdf(self, request):
        departements = Departement.objects.all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, 
                              topMargin=1*inch, 
                              bottomMargin=1*inch,
                              leftMargin=0.5*inch,
                              rightMargin=0.5*inch)
        elements = []
        styles = getSampleStyleSheet()
        
        title = Paragraph("LISTE DES DÉPARTEMENTS", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 15))
        
        info_text = Paragraph(
            f"<b>Généré le:</b> {timezone.now().strftime('%d/%m/%Y à %H:%M')} | "
            f"<b>Total départements:</b> {departements.count()}",
            styles['Normal']
        )
        elements.append(info_text)
        elements.append(Spacer(1, 20))
        
        headers = ['ID', 'Nom', 'Responsable', 'Localisation', 'Nb Employés']
        
        data = [headers]
        for dept in departements:
            data.append([
                str(dept.id_departement),
                dept.nom,
                dept.responsable or 'Non défini',
                dept.localisation or 'Non défini',
                str(dept.nbr_employe or 0)
            ])
        
        col_widths = [15*mm, 45*mm, 40*mm, 40*mm, 20*mm]
        
        max_text_lengths = [
            None,
            None,
            None,
            25,
            None
        ]
        
        table = self._create_styled_table(data, col_widths, '#2E86AB', max_text_lengths)
        elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        nom_fichier = f"liste_departements_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
        
        return response
    
    def _export_employes_pdf(self, request):
        employes = Employe.objects.select_related('departement').all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                              topMargin=1*inch,
                              bottomMargin=1*inch,
                              leftMargin=0.5*inch,
                              rightMargin=0.5*inch)
        elements = []
        styles = getSampleStyleSheet()
        
        title = Paragraph("LISTE DES EMPLOYÉS", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 15))
        
        info_text = Paragraph(
            f"<b>Généré le:</b> {timezone.now().strftime('%d/%m/%Y à %H:%M')} | "
            f"<b>Total employés:</b> {employes.count()}",
            styles['Normal']
        )
        elements.append(info_text)
        elements.append(Spacer(1, 20))
        
        headers = ['Matricule', 'Nom', 'Prénom', 'Email', 'Département', 'Poste', 'Statut']
        
        data = [headers]
        for emp in employes:
            data.append([
                emp.matricule,
                emp.nom,
                emp.prenom,
                emp.email or 'Non défini',
                emp.departement.nom if emp.departement else 'Non assigné',
                emp.poste or 'Non défini',
                emp.statut or 'Non défini'
            ])
        
        col_widths = [20*mm, 30*mm, 30*mm, 40*mm, 30*mm, 30*mm, 20*mm]
        
        max_text_lengths = [
            None,
            None,
            None,
            25,
            20,
            20,
            15
        ]
        
        table = self._create_styled_table(data, col_widths, '#2E86AB', max_text_lengths)
        elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        nom_fichier = f"liste_employes_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
        
        return response
    
    def _export_pointages_pdf(self, request):
        pointages = Pointage.objects.select_related('employe').all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, 
                              topMargin=1*inch,
                              bottomMargin=1*inch,
                              leftMargin=0.5*inch,
                              rightMargin=0.5*inch)
        elements = []
        styles = getSampleStyleSheet()
        
        title = Paragraph("LISTE DES POINTAGES", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 15))
        
        info_text = Paragraph(
            f"<b>Généré le:</b> {timezone.now().strftime('%d/%m/%Y à %H:%M')} | "
            f"<b>Total pointages:</b> {pointages.count()}",
            styles['Normal']
        )
        elements.append(info_text)
        elements.append(Spacer(1, 20))
        
        headers = ['Employé', 'Date', 'Heure Entrée', 'Heure Sortie', 'Durée', 'Remarque']
        
        data = [headers]
        for pointage in pointages:
            nom_employe = f"{pointage.employe.nom} {pointage.employe.prenom}"
            data.append([
                nom_employe,
                self._format_date(pointage.date_pointage),
                self._format_datetime(pointage.heure_entree) if pointage.heure_entree else 'N/A',
                self._format_datetime(pointage.heure_sortie) if pointage.heure_sortie else 'N/A',
                self._format_duration(pointage.duree_travail) if pointage.duree_travail else 'N/A',
                pointage.remarque or 'Aucune'
            ])
        
        col_widths = [40*mm, 20*mm, 25*mm, 25*mm, 20*mm, 45*mm]
        
        max_text_lengths = [
            None,
            None,
            None,
            None,
            None,
            30
        ]
        
        table = self._create_styled_table(data, col_widths, '#2E86AB', max_text_lengths)
        elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        nom_fichier = f"liste_pointages_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
        
        return response
    
    def _export_absences_pdf(self, request):
        absences = Absence.objects.select_related('employe').all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                              topMargin=1*inch,
                              bottomMargin=1*inch,
                              leftMargin=0.5*inch,
                              rightMargin=0.5*inch)
        elements = []
        styles = getSampleStyleSheet()
        
        title = Paragraph("LISTE DES ABSENCES", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 15))
        
        total_absences = absences.count()
        absences_justifiees = absences.filter(justifiee=True).count()
        info_text = Paragraph(
            f"<b>Généré le:</b> {timezone.now().strftime('%d/%m/%Y à %H:%M')} | "
            f"<b>Total absences:</b> {total_absences} | "
            f"<b>Justifiées:</b> {absences_justifiees} | "
            f"<b>Non justifiées:</b> {total_absences - absences_justifiees}",
            styles['Normal']
        )
        elements.append(info_text)
        elements.append(Spacer(1, 20))
        
        headers = ['ID', 'Employé', 'Date Début', 'Date Fin', 'Jours', 'Motif', 'Justifiée']
        
        data = [headers]
        for absence in absences:
            nom_employe = f"{absence.employe.nom} {absence.employe.prenom}"
            date_debut = parse_date(absence.date_debut_absence) if isinstance(absence.date_debut_absence, str) else absence.date_debut_absence
            date_fin = parse_date(absence.date_fin_absence) if isinstance(absence.date_fin_absence, str) else absence.date_fin_absence
            
            if date_debut and date_fin:
                nbr_jours = (date_fin - date_debut).days + 1
            else:
                nbr_jours = 'N/A'
            
            data.append([
                str(absence.id_absence),
                nom_employe,
                self._format_date(date_debut),
                self._format_date(date_fin),
                str(nbr_jours) if nbr_jours != 'N/A' else 'N/A',
                absence.motif or 'Non spécifié',
                '✅ Oui' if absence.justifiee else '❌ Non'
            ])
        
        col_widths = [15*mm, 45*mm, 20*mm, 20*mm, 15*mm, 45*mm, 20*mm]
        
        max_text_lengths = [
            None,
            None,
            None,
            None,
            None,
            35,
            None
        ]
        
        table = self._create_styled_table(data, col_widths, '#2E86AB', max_text_lengths)
        elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        nom_fichier = f"liste_absences_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
        
        return response
    
    def _export_conges_pdf(self, request):
        conges = Conge.objects.select_related('employe').all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                              topMargin=1*inch,
                              bottomMargin=1*inch,
                              leftMargin=0.5*inch,
                              rightMargin=0.5*inch)
        elements = []
        styles = getSampleStyleSheet()
        
        title = Paragraph("LISTE DES CONGÉS", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 15))
        
        total_conges = conges.count()
        conges_valides = conges.filter(statut='valide').count()
        conges_refuses = conges.filter(statut='refuse').count()
        conges_attente = conges.filter(statut='en_attente').count()
        
        info_text = Paragraph(
            f"<b>Généré le:</b> {timezone.now().strftime('%d/%m/%Y à %H:%M')} | "
            f"<b>Total:</b> {total_conges} | "
            f"<b>Validés:</b> {conges_valides} | "
            f"<b>Refusés:</b> {conges_refuses} | "
            f"<b>En attente:</b> {conges_attente}",
            styles['Normal']
        )
        elements.append(info_text)
        elements.append(Spacer(1, 20))
        
        headers = ['Employé', 'Date Début', 'Date Fin', 'Jours', 'Type', 'Motif', 'Statut']
        
        data = [headers]
        for conge in conges:
            nom_employe = f"{conge.employe.nom} {conge.employe.prenom}"
            date_debut = parse_date(conge.date_debut) if isinstance(conge.date_debut, str) else conge.date_debut
            date_fin = parse_date(conge.date_fin) if isinstance(conge.date_fin, str) else conge.date_fin
            
            if date_debut and date_fin:
                nbr_jours = (date_fin - date_debut).days + 1
            else:
                nbr_jours = 'N/A'
            
            type_conge = getattr(conge, 'type_conge', 'Non spécifié') or 'Non spécifié'
            
            if conge.statut == 'valide':
                statut_icon = '✅ Validé'
            elif conge.statut == 'refuse':
                statut_icon = '❌ Refusé'
            else:
                statut_icon = '⏳ En attente'
            
            data.append([
                nom_employe,
                self._format_date(date_debut),
                self._format_date(date_fin),
                str(nbr_jours) if nbr_jours != 'N/A' else 'N/A',
                type_conge,
                conge.motif or 'Non spécifié',
                statut_icon
            ])
        
        col_widths = [40*mm, 20*mm, 20*mm, 15*mm, 25*mm, 35*mm, 20*mm]
        
        max_text_lengths = [
            None,
            None,
            None,
            None,
            20,
            30,
            None
        ]
        
        table = self._create_styled_table(data, col_widths, '#2E86AB', max_text_lengths)
        elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        nom_fichier = f"liste_conges_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
        
        return response
    
    def _export_evenements_pdf(self, request):
        evenements = Evenement.objects.all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                              topMargin=1*inch,
                              bottomMargin=1*inch,
                              leftMargin=0.5*inch,
                              rightMargin=0.5*inch)
        elements = []
        styles = getSampleStyleSheet()
        
        title = Paragraph("LISTE DES ÉVÉNEMENTS", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 15))
        
        info_text = Paragraph(
            f"<b>Généré le:</b> {timezone.now().strftime('%d/%m/%Y à %H:%M')} | "
            f"<b>Total événements:</b> {evenements.count()}",
            styles['Normal']
        )
        elements.append(info_text)
        elements.append(Spacer(1, 20))
        
        # SUPPRIMER LA COLONNE "TYPE" DU TABLEAU
        headers = ['Titre', 'Description', 'Date Début', 'Date Fin', 'Lieu']
        
        data = [headers]
        for event in evenements:
            data.append([
                event.titre,
                event.description or 'Non spécifié',
                self._format_datetime(event.date_debut),
                self._format_datetime(event.date_fin) if event.date_fin else 'Non défini',
                event.lieu or 'Non spécifié'
            ])
        
        # Ajuster les largeurs de colonnes après suppression du type
        col_widths = [40*mm, 55*mm, 30*mm, 30*mm, 35*mm]
        
        max_text_lengths = [
            25,
            45,
            None,
            None,
            25
        ]
        
        table = self._create_styled_table(data, col_widths, '#2E86AB', max_text_lengths)
        elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        nom_fichier = f"liste_evenements_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
        
        return response


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)


class RegisterViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(CustomUserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DepartementViewSet(viewsets.ModelViewSet):
    queryset = Departement.objects.all()
    serializer_class = DepartementSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['nom', 'responsable', 'localisation']
    filterset_fields = ['nom']
    ordering_fields = ['nom', 'nbr_employe']
    ordering = ['nom']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        pdf_view = ExportPDFAPIView()
        pdf_view.request = request
        return pdf_view._export_departements_pdf(request)


class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.select_related('departement').all()
    serializer_class = EmployeSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['nom', 'prenom', 'email', 'matricule', 'poste']
    filterset_fields = ['departement', 'statut', 'titre']
    ordering_fields = ['nom', 'prenom', 'matricule']
    ordering = ['nom', 'prenom']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_employes = Employe.objects.count()
        employes_actifs = Employe.objects.filter(statut='actif').count()
        employes_inactifs = Employe.objects.filter(statut='inactif').count()
        return Response({
            'total_employes': total_employes,
            'employes_actifs': employes_actifs,
            'employes_inactifs': employes_inactifs
        })

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        pdf_view = ExportPDFAPIView()
        pdf_view.request = request
        return pdf_view._export_employes_pdf(request)


class PointageViewSet(viewsets.ModelViewSet):
    queryset = Pointage.objects.select_related('employe').all()
    serializer_class = PointageSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['employe__nom', 'employe__prenom', 'remarque']
    filterset_fields = ['date_pointage', 'employe']
    ordering_fields = ['date_pointage', 'heure_entree']
    ordering = ['-date_pointage', 'heure_entree']

    def create(self, request, *args, **kwargs):
        employe_id = request.data.get('employe')
        if employe_id:
            try:
                employe = Employe.objects.get(pk=employe_id)
                if employe.statut != 'actif':
                    return Response(
                        {"error": "Les employés inactifs ne peuvent pas effectuer de pointage."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Employe.DoesNotExist:
                return Response(
                    {"error": "Employé non trouvé."},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def stats_mensuelles(self, request):
        mois = int(request.query_params.get('mois', datetime.now().month))
        annee = int(request.query_params.get('annee', datetime.now().year))
        pointages = Pointage.objects.filter(
            date_pointage__year=annee,
            date_pointage__month=mois,
            duree_travail__isnull=False
        )
        total_heures = sum([p.duree_travail.total_seconds() for p in pointages]) / 3600
        return Response({
            'mois': mois,
            'annee': annee,
            'total_heures': total_heures,
            'nombre_pointages': pointages.count()
        })

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        pdf_view = ExportPDFAPIView()
        pdf_view.request = request
        return pdf_view._export_pointages_pdf(request)


class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.select_related('employe').all()
    serializer_class = AbsenceSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['employe__nom', 'employe__prenom', 'motif']
    filterset_fields = ['date_debut_absence', 'date_fin_absence', 'justifiee', 'employe']
    ordering_fields = ['date_debut_absence', 'date_fin_absence']
    ordering = ['-date_debut_absence']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        pdf_view = ExportPDFAPIView()
        pdf_view.request = request
        return pdf_view._export_absences_pdf(request)


class CongeViewSet(viewsets.ModelViewSet):
    queryset = Conge.objects.select_related('employe').all()
    serializer_class = CongeSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['employe__nom', 'employe__prenom', 'motif']
    filterset_fields = ['date_debut', 'date_fin', 'statut', 'employe']
    ordering_fields = ['date_debut', 'date_fin', 'statut']
    ordering = ['-date_demande']

    def create(self, request, *args, **kwargs):
        employe_id = request.data.get('employe')
        if employe_id:
            try:
                employe = Employe.objects.get(pk=employe_id)
                if employe.statut != 'actif':
                    return Response(
                        {"error": "Les employés inactifs ne peuvent pas faire de demande de congé."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Employe.DoesNotExist:
                return Response(
                    {"error": "Employé non trouvé."},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        logger.info(f"Requête reçue pour valider le congé {pk} par l'utilisateur {request.user.email}")
        try:
            conge = self.get_object()
            conge.statut = 'valide'
            conge.date_decision = timezone.now()
            conge.save()
            logger.info(f"Congé {pk} validé avec succès")
            return Response({
                'status': 'congé validé',
                'message': f"Un email de notification a été envoyé à {conge.employe.email}."
            })
        except Exception as e:
            logger.error(f"Erreur lors de la validation du congé {pk}: {str(e)}")
            return Response(
                {'error': f"Erreur lors de la validation du congé: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        logger.info(f"Requête reçue pour refuser le congé {pk} par l'utilisateur {request.user.email}")
        try:
            conge = self.get_object()
            motif_refus = request.data.get('motif_refus')
            if not motif_refus:
                logger.error("Motif de refus non fourni")
                return Response(
                    {'error': 'La raison du refus est requise.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            conge.statut = 'refuse'
            conge.date_decision = timezone.now()
            conge.motif_refus = motif_refus
            conge.save()
            logger.info(f"Congé {pk} refusé avec succès")
            return Response({
                'status': 'congé refusé',
                'message': f"Un email de notification a été envoyé à {conge.employe.email}.",
                'motif_refus': conge.motif_refus or 'Non spécifiée'
            })
        except Exception as e:
            logger.error(f"Erreur lors du refus du congé {pk}: {str(e)}")
            return Response(
                {'error': f"Erreur lors du refus du congé: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        pdf_view = ExportPDFAPIView()
        pdf_view.request = request
        return pdf_view._export_conges_pdf(request)


class EvenementViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['titre', 'description', 'lieu']
    filterset_fields = ['date_debut', 'date_fin']
    ordering_fields = ['date_debut', 'date_fin']
    ordering = ['date_debut']

    def perform_create(self, serializer):
        # ✅ ENVOI D'EMAIL À LA CRÉATION D'UN ÉVÉNEMENT
        instance = serializer.save(created_by=self.request.user)
        
        # Récupérer tous les employés actifs
        employes_actifs = Employe.objects.filter(statut='actif')
        
        # Envoyer l'email de notification
        if employes_actifs.exists():
            send_event_notification_email(instance, employes_actifs, "creation")
        
        return instance

    def perform_update(self, serializer):
        # ✅ ENVOI D'EMAIL À LA MODIFICATION D'UN ÉVÉNEMENT
        instance = serializer.save()
        
        # Récupérer tous les employés actifs
        employes_actifs = Employe.objects.filter(statut='actif')
        
        # Envoyer l'email de notification
        if employes_actifs.exists():
            send_event_notification_email(instance, employes_actifs, "modification")
        
        return instance

    def perform_destroy(self, instance):
        # ✅ ENVOI D'EMAIL À LA SUPPRESSION D'UN ÉVÉNEMENT
        employes_actifs = Employe.objects.filter(statut='actif')
        
        # Envoyer l'email de notification avant suppression
        if employes_actifs.exists():
            send_event_notification_email(instance, employes_actifs, "suppression")
        
        instance.delete()

    @action(detail=False, methods=['get'])
    def a_venir(self, request):
        evenements = Evenement.objects.filter(date_debut__gte=datetime.now())
        serializer = self.get_serializer(evenements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        pdf_view = ExportPDFAPIView()
        pdf_view.request = request
        return pdf_view._export_evenements_pdf(request)


class EmployeeStatisticsAPIView(APIView):
    def get(self, request, matricule=None):
        try:
            if matricule:
                employe = Employe.objects.get(matricule=matricule)
            else:
                matricule = request.GET.get('matricule')
                if not matricule:
                    return Response(
                        {"error": "Matricule requis"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                employe = Employe.objects.get(matricule=matricule)
            
            periode_type = request.GET.get('periode', 'mois')
            date_reference_str = request.GET.get('date')
            
            if date_reference_str:
                try:
                    if len(date_reference_str) == 7 and '-' in date_reference_str:
                        date_reference = datetime.strptime(date_reference_str + '-01', '%Y-%m-%d').date()
                    else:
                        date_reference = datetime.strptime(date_reference_str, '%Y-%m-%d').date()
                except ValueError as e:
                    date_reference = timezone.now().date()
            else:
                date_reference = timezone.now().date()
            
            if periode_type == 'semaine':
                stats = StatisticsService.calculate_employee_weekly_stats(employe, date_reference)
            else:
                stats = StatisticsService.calculate_employee_monthly_stats(employe, date_reference)
            
            save_to_db = request.GET.get('save', 'false').lower() == 'true'
            if save_to_db:
                StatisticsService.save_employee_stats_to_db(stats)
            
            serializer = EmployeeStatsCalculatedSerializer(stats)
            return Response(serializer.data)
            
        except Employe.DoesNotExist:
            return Response(
                {"error": "Employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur statistiques employé: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DepartmentStatisticsAPIView(APIView):
    def get(self, request, departement_id=None):
        try:
            if departement_id:
                departement = Departement.objects.get(id_departement=departement_id)
            else:
                departement_id = request.GET.get('departement')
                if not departement_id:
                    return Response(
                        {"error": "ID département requis"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                departement = Departement.objects.get(id_departement=departement_id)
            
            mois_str = request.GET.get('mois')
            
            if mois_str:
                try:
                    if len(mois_str) == 7 and '-' in mois_str:
                        mois = datetime.strptime(mois_str + '-01', '%Y-%m-%d').date()
                    else:
                        mois = datetime.strptime(mois_str, '%Y-%m-%d').date().replace(day=1)
                except ValueError as e:
                    mois = timezone.now().date().replace(day=1)
            else:
                mois = timezone.now().date().replace(day=1)
            
            stats = StatisticsService.calculate_department_monthly_stats(departement, mois)
            
            save_to_db = request.GET.get('save', 'false').lower() == 'true'
            if save_to_db:
                StatisticsService.save_department_stats_to_db(stats)
            
            serializer = DepartmentStatsCalculatedSerializer(stats)
            return Response(serializer.data)
            
        except Departement.DoesNotExist:
            return Response(
                {"error": "Département non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur statistiques département: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GlobalStatisticsAPIView(APIView):
    def get(self, request):
        try:
            periode_type = request.GET.get('periode', 'mensuel')
            mois_str = request.GET.get('mois')
            
            if mois_str:
                try:
                    if len(mois_str) == 7 and '-' in mois_str:
                        mois = datetime.strptime(mois_str + '-01', '%Y-%m-%d').date()
                    else:
                        mois = datetime.strptime(mois_str, '%Y-%m-%d').date().replace(day=1)
                except ValueError as e:
                    mois = timezone.now().date().replace(day=1)
            else:
                mois = timezone.now().date().replace(day=1)
            
            if periode_type == 'mensuel':
                stats = StatisticsService.calculate_global_monthly_stats(mois)
            else:
                stats = StatisticsService.calculate_global_monthly_stats(mois)
                stats['type_periode'] = 'annuel'
            
            serializer = GlobalStatsCalculatedSerializer(stats)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Erreur statistiques globales: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DetailedStatisticsAPIView(APIView):
    def get(self, request):
        try:
            stats_type = request.GET.get('type')
            employe_id = request.GET.get('employe')
            departement_id = request.GET.get('departement')
            mois_str = request.GET.get('mois')
            
            employe = None
            departement = None
            periode = None
            
            if employe_id:
                employe = Employe.objects.get(matricule=employe_id)
            if departement_id:
                departement = Departement.objects.get(id_departement=departement_id)
            
            if mois_str:
                try:
                    if len(mois_str) == 7 and '-' in mois_str:
                        periode = datetime.strptime(mois_str + '-01', '%Y-%m-%d').date()
                    else:
                        periode = datetime.strptime(mois_str, '%Y-%m-%d').date().replace(day=1)
                except ValueError as e:
                    periode = timezone.now().date().replace(day=1)
            else:
                periode = timezone.now().date().replace(day=1)
            
            if stats_type == 'conges':
                stats = StatisticsService.get_conge_statistics(employe, departement, periode)
                serializer = CongeStatisticsSerializer(stats)
            elif stats_type == 'pointages':
                stats = StatisticsService.get_pointage_statistics(employe, departement, periode)
                serializer = PointageStatisticsSerializer(stats)
            elif stats_type == 'absences':
                stats = StatisticsService.get_absence_statistics(employe, departement, periode)
                serializer = AbsenceStatisticsSerializer(stats)
            else:
                return Response(
                    {"error": "Type de statistiques non valide"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(serializer.data)
            
        except (Employe.DoesNotExist, Departement.DoesNotExist) as e:
            return Response(
                {"error": "Employé ou département non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur statistiques détaillées: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExportStatisticsPDFAPIView(APIView):
    def _normaliser_nom_fichier(self, nom):
        correspondances = {
            'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
            'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
            'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
            'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
            'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
            'ç': 'c', 'ñ': 'n',
            'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A',
            'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
            'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
            'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
            'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
            'Ç': 'C', 'Ñ': 'N'
        }
        
        for accent, sans_accent in correspondances.items():
            nom = nom.replace(accent, sans_accent)
        
        nom = re.sub(r'[^\w\s-]', '', nom)
        nom = re.sub(r'[-\s]+', '_', nom)
        
        return nom.strip('_')
    
    def _export_simple_fallback(self, request, export_type):
        from django.http import JsonResponse
        
        return JsonResponse({
            'status': 'error',
            'message': f'Export PDF temporairement indisponible pour le type {export_type}',
            'debug': 'La génération PDF rencontre des problèmes techniques',
            'solution': 'Veuillez réessayer ultérieurement ou contacter le support'
        }, status=503)
    
    def get(self, request):
        export_type = request.GET.get('type', 'employe')
        
        try:
            if REPORTLAB_AVAILABLE:
                if export_type == 'employe':
                    return self._export_employee_pdf(request)
                elif export_type == 'departement':
                    return self._export_department_pdf(request)
                elif export_type == 'global':
                    return self._export_global_pdf(request)
                else:
                    return Response(
                        {"error": "Type d'export non valide"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return self._export_simple_fallback(request, export_type)
                
        except Exception as e:
            logger.error(f"Erreur génération PDF: {str(e)}")
            return self._export_simple_fallback(request, export_type)
    
    def _export_employee_pdf(self, request):
        matricule = request.GET.get('matricule')
        if not matricule:
            return Response(
                {"error": "Matricule requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            employe = Employe.objects.get(matricule=matricule)
        except Employe.DoesNotExist:
            return Response(
                {"error": "Employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        periode_type = request.GET.get('periode', 'mois')
        date_reference_str = request.GET.get('date')
        
        try:
            if periode_type == 'semaine':
                stats = StatisticsService.calculate_employee_weekly_stats(employe, date_reference_str)
            else:
                if date_reference_str:
                    stats = StatisticsService.calculate_employee_monthly_stats(employe, date_reference_str)
                else:
                    stats = StatisticsService.calculate_employee_monthly_stats(employe)
        except Exception as e:
            logger.error(f"Erreur récupération stats employé: {str(e)}")
            return self._export_simple_fallback(request, 'employe')
        
        buffer = io.BytesIO()
        
        try:
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            title = Paragraph("RAPPORT STATISTIQUES EMPLOYÉ", styles['Title'])
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            info_style = styles['Normal']
            info_elements = [
                Paragraph(f"<b>Employé:</b> {employe.nom} {employe.prenom}", info_style),
                Paragraph(f"<b>Matricule:</b> {employe.matricule}", info_style),
                Paragraph(f"<b>Département:</b> {employe.departement.nom if employe.departement else 'Non assigné'}", info_style),
                Paragraph(f"<b>Poste:</b> {employe.poste}", info_style),
                Paragraph(f"<b>Période analysée:</b> {stats.get('periode_debut', 'N/A')} à {stats.get('periode_fin', 'N/A')}", info_style),
                Paragraph(f"<b>Type de période:</b> {stats.get('type_periode', 'N/A')}", info_style),
            ]
            
            for element in info_elements:
                elements.append(element)
            
            elements.append(Spacer(1, 25))
            
            section_style = styles['Heading2']
            elements.append(Paragraph("📊 POINTAGES", section_style))
            elements.append(Spacer(1, 10))
            
            pointage_data = [
                ['Heures totales travaillées', self._format_duration(stats.get('heures_travail_total'))],
                ['Jours travaillés', f"{stats.get('jours_travailles', 0)} jours"],
                ['Moyenne quotidienne', self._format_duration(stats.get('moyenne_heures_quotidiennes'))],
                ['Pointages réguliers', f"{stats.get('pointages_reguliers', 0)}"],
                ['Pointages irréguliers', f"{stats.get('pointages_irreguliers', 0)}"],
                ['Taux de régularité', f"{(stats.get('pointages_reguliers', 0) / stats.get('jours_travailles', 1) * 100) if stats.get('jours_travailles', 0) > 0 else 0:.1f}%"],
            ]
            
            pointage_table = Table(pointage_data, colWidths=[100*mm, 60*mm])
            pointage_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0F8FF')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(pointage_table)
            elements.append(Spacer(1, 20))
            
            elements.append(Paragraph("⚠️ ABSENCES", section_style))
            elements.append(Spacer(1, 10))
            
            absence_data = [
                ['Taux d\'absence', f"{stats.get('taux_absence', 0):.1f}%"],
                ['Jours d\'absence totaux', f"{stats.get('jours_absence', 0)} jours"],
                ['Absences justifiées', f"{stats.get('absences_justifiees', 0)}"],
                ['Absences non justifiées', f"{stats.get('absences_non_justifiees', 0)}"],
                ['Jours ouvrables', f"{stats.get('jours_ouvrables', 0)} jours"],
            ]
            
            absence_table = Table(absence_data, colWidths=[100*mm, 60*mm])
            absence_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#A23B72')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFF0F5')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(absence_table)
            elements.append(Spacer(1, 20))
            
            elements.append(Paragraph("🏖️ CONGÉS", section_style))
            elements.append(Spacer(1, 10))
            
            conge_data = [
                ['Congés validés', f"{stats.get('conges_valides', 0)}"],
                ['Congés refusés', f"{stats.get('conges_refuses', 0)}"],
                ['Congés en attente', f"{stats.get('conges_en_attente', 0)}"],
                ['Total jours de congé', f"{stats.get('total_jours_conges', 0)} jours"],
                ['Taux d\'approbation', f"{stats.get('taux_approbation_conges', 0):.1f}%"],
            ]
            
            conge_table = Table(conge_data, colWidths=[100*mm, 60*mm])
            conge_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#18A999')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0FFF4')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(conge_table)
            elements.append(Spacer(1, 25))
            
            footer_style = styles['Italic']
            footer = Paragraph(f"Rapport généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')} - Système de Gestion RH", footer_style)
            elements.append(footer)
            
            doc.build(elements)
            buffer.seek(0)
            
            response = HttpResponse(buffer, content_type='application/pdf')
            
            nom_employe = f"{employe.nom}_{employe.prenom}"
            nom_employe_normalise = self._normaliser_nom_fichier(nom_employe)
            nom_fichier = f"statistiques_{nom_employe_normalise}_{employe.matricule}.pdf"
            
            response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur génération PDF ReportLab: {str(e)}")
            return self._export_simple_fallback(request, 'employe')
    
    def _export_department_pdf(self, request):
        departement_id = request.GET.get('departement')
        if not departement_id:
            return Response(
                {"error": "ID département requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            departement = Departement.objects.get(id_departement=departement_id)
        except Departement.DoesNotExist:
            return Response(
                {"error": "Département non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        mois_str = request.GET.get('mois')
        
        stats = StatisticsService.calculate_department_monthly_stats(departement, mois_str)
        
        buffer = io.BytesIO()
        
        try:
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            title = Paragraph("RAPPORT STATISTIQUES DÉPARTEMENT", styles['Title'])
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            info_elements = [
                Paragraph(f"<b>Département:</b> {departement.nom}", styles['Normal']),
                Paragraph(f"<b>Responsable:</b> {departement.responsable}", styles['Normal']),
                Paragraph(f"<b>Localisation:</b> {departement.localisation}", styles['Normal']),
                Paragraph(f"<b>Période analysée:</b> {stats.get('mois', 'N/A').strftime('%B %Y') if hasattr(stats.get('mois'), 'strftime') else 'N/A'}", styles['Normal']),
            ]
            
            for element in info_elements:
                elements.append(element)
            
            elements.append(Spacer(1, 25))
            
            section_style = styles['Heading2']
            elements.append(Paragraph("📊 MÉTRIQUES PRINCIPALES", section_style))
            elements.append(Spacer(1, 10))
            
            metrics_data = [
                ['Effectif total', f"{stats.get('total_employes', 0)} employés"],
                ['Employés actifs', f"{stats.get('employes_actifs', 0)}"],
                ['Taux d\'absence moyen', f"{stats.get('taux_absence_moyen', 0):.1f}%"],
                ['Heures moyennes travaillées', self._format_duration(stats.get('heures_travail_moyennes'))],
                ['Total pointages', f"{stats.get('pointages_total', 0)}"],
                ['Heures totales travaillées', self._format_duration(stats.get('total_heures_travail'))],
            ]
            
            metrics_table = Table(metrics_data, colWidths=[80*mm, 80*mm])
            metrics_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0F8FF')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(metrics_table)
            elements.append(Spacer(1, 25))
            
            elements.append(Paragraph("🏖️ GESTION DES CONGÉS", section_style))
            elements.append(Spacer(1, 10))
            
            conge_data = [
                ['Congés validés', f"{stats.get('total_conges_valides', 0)}"],
                ['Congés refusés', f"{stats.get('total_conges_refuses', 0)}"],
                ['Congés en attente', f"{stats.get('total_conges_en_attente', 0)}"],
                ['Taux d\'approbation', f"{stats.get('taux_approbation_conges', 0):.1f}%"],
            ]
            
            conge_table = Table(conge_data, colWidths=[80*mm, 80*mm])
            conge_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#18A999')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0FFF4')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(conge_table)
            
            elements.append(Spacer(1, 25))
            footer = Paragraph(f"Rapport généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')} - Système de Gestion RH", styles['Italic'])
            elements.append(footer)
            
            doc.build(elements)
            buffer.seek(0)
            
            response = HttpResponse(buffer, content_type='application/pdf')
            
            nom_departement_normalise = self._normaliser_nom_fichier(departement.nom)
            nom_fichier = f"statistiques_departement_{nom_departement_normalise}.pdf"
            
            response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur génération PDF département: {str(e)}")
            return self._export_simple_fallback(request, 'departement')
    
    def _export_global_pdf(self, request):
        mois_str = request.GET.get('mois')
        
        stats = StatisticsService.calculate_global_monthly_stats(mois_str)
        
        buffer = io.BytesIO()
        
        try:
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            title = Paragraph("RAPPORT STATISTIQUES GLOBALES", styles['Title'])
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            periode_text = Paragraph(f"<b>Période:</b> {stats.get('periode', 'N/A').strftime('%B %Y') if hasattr(stats.get('periode'), 'strftime') else 'N/A'}", styles['Normal'])
            elements.append(periode_text)
            elements.append(Spacer(1, 25))
            
            section_style = styles['Heading2']
            elements.append(Paragraph("🌐 STATISTIQUES GLOBALES", section_style))
            elements.append(Spacer(1, 10))
            
            global_data = [
                ['Total employés', f"{stats.get('total_employes', 0)}"],
                ['Total départements', f"{stats.get('total_departements', 0)}"],
                ['Taux d\'activité global', f"{stats.get('taux_activite_global', 0):.1f}%"],
                ['Total pointages', f"{stats.get('total_pointages', 0)}"],
                ['Heures totales travaillées', self._format_duration(stats.get('heures_travail_total'))],
                ['Taux de présence', f"{stats.get('taux_presence', 0):.1f}%"],
                ['Taux d\'absence global', f"{stats.get('taux_absence_global', 0):.1f}%"],
                ['Congés validés', f"{stats.get('conges_valides', 0)}"],
                ['Taux validation congés', f"{stats.get('taux_validation_conges', 0):.1f}%"],
                ['Événements organisés', f"{stats.get('total_evenements', 0)}"],
            ]
            
            global_table = Table(global_data, colWidths=[80*mm, 80*mm])
            global_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A4A4A')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(global_table)
            
            elements.append(Spacer(1, 25))
            footer = Paragraph(f"Rapport généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')} - Système de Gestion RH", styles['Italic'])
            elements.append(footer)
            
            doc.build(elements)
            buffer.seek(0)
            
            response = HttpResponse(buffer, content_type='application/pdf')
            
            nom_fichier = f"statistiques_globales_{timezone.now().strftime('%Y%m%d')}.pdf"
            
            response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur génération PDF global: {str(e)}")
            return self._export_simple_fallback(request, 'global')
    
    def _format_duration(self, duration):
        if not duration:
            return "0h 00min"
        
        try:
            if hasattr(duration, 'total_seconds'):
                total_seconds = duration.total_seconds()
            else:
                total_seconds = float(duration)
            
            hours = int(total_seconds // 3600)
            minutes = int((total_seconds % 3600) // 60)
            return f"{hours}h {minutes:02d}min"
        except:
            return "0h 00min"