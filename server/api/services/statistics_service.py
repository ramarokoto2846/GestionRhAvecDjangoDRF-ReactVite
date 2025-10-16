from django.db.models import Q, Count, Avg, Sum, DurationField
from django.db.models.functions import ExtractHour, ExtractMinute, Cast
from datetime import timedelta, datetime, time
from django.utils import timezone
from django.core.cache import cache
import json

class StatisticsService:
    
    @staticmethod
    def calculate_employee_weekly_stats(employe, date_reference=None):
        """Calcule les statistiques hebdomadaires complètes d'un employé"""
        # Convertir la date_reference en objet date si c'est une string
        if isinstance(date_reference, str):
            try:
                date_reference = datetime.strptime(date_reference, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                date_reference = timezone.now().date()
        
        if not date_reference:
            date_reference = timezone.now().date()
        
        start_of_week = date_reference - timedelta(days=date_reference.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        # DEBUG: Afficher les dates de filtrage
        print(f"🔍 [STATS SEMAINE] Employé: {employe.matricule}, Période: {start_of_week} à {end_of_week}")
        
        # === STATISTIQUES POINTAGE ===
        pointages = employe.pointages.filter(
            date_pointage__range=[start_of_week, end_of_week]
        ).exclude(duree_travail=None)
        
        print(f"📊 [STATS SEMAINE] Pointages trouvés: {pointages.count()}")
        
        # Heures totales travaillées
        total_heures = sum(
            (p.duree_travail for p in pointages if p.duree_travail),
            timedelta()
        )
        
        # Jours travaillés
        jours_travailles = pointages.count()
        
        # Moyenne heures quotidiennes
        moyenne_quotidienne = total_heures / jours_travailles if jours_travailles > 0 else timedelta()
        
        # Pointages réguliers (entrée avant 9h)
        pointages_reguliers = pointages.filter(heure_entree__lte=time(9, 0)).count()
        pointages_irreguliers = jours_travailles - pointages_reguliers
        
        # === STATISTIQUES ABSENCE ===
        absences = employe.absences.filter(
            date_debut_absence__lte=end_of_week,
            date_fin_absence__gte=start_of_week
        )
        
        print(f"⚠️ [STATS SEMAINE] Absences trouvées: {absences.count()}")
        
        jours_absence = 0
        absences_justifiees = 0
        absences_non_justifiees = 0
        
        for absence in absences:
            debut = max(absence.date_debut_absence, start_of_week)
            fin = min(absence.date_fin_absence, end_of_week)
            jours_absence_periode = (fin - debut).days + 1
            jours_absence += jours_absence_periode
            
            if absence.justifiee:
                absences_justifiees += jours_absence_periode
            else:
                absences_non_justifiees += jours_absence_periode
        
        # Jours ouvrables dans la semaine (5 jours)
        jours_ouvrables = 5
        taux_absence = (jours_absence / jours_ouvrables) * 100 if jours_ouvrables > 0 else 0
        
        # === STATISTIQUES CONGÉ ===
        conges = employe.conges.filter(
            date_debut__lte=end_of_week,
            date_fin__gte=start_of_week
        )
        
        print(f"🏖️ [STATS SEMAINE] Congés trouvés: {conges.count()}")
        
        conges_valides = conges.filter(statut='valide').count()
        conges_refuses = conges.filter(statut='refuse').count()
        conges_en_attente = conges.filter(statut='en_attente').count()
        
        # Total jours de congé dans la période
        total_jours_conges = 0
        for conge in conges.filter(statut='valide'):
            debut = max(conge.date_debut, start_of_week)
            fin = min(conge.date_fin, end_of_week)
            total_jours_conges += (fin - debut).days + 1
        
        # Taux d'approbation des congés
        total_conges_traites = conges_valides + conges_refuses
        taux_approbation = (conges_valides / total_conges_traites * 100) if total_conges_traites > 0 else 0
        
        stats = {
            'employe': employe,
            'periode_debut': start_of_week,
            'periode_fin': end_of_week,
            'type_periode': 'hebdo',
            
            # Pointage
            'heures_travail_total': total_heures,
            'jours_travailles': jours_travailles,
            'moyenne_heures_quotidiennes': moyenne_quotidienne,
            'pointages_reguliers': pointages_reguliers,
            'pointages_irreguliers': pointages_irreguliers,
            
            # Absence
            'taux_absence': round(taux_absence, 2),
            'jours_absence': jours_absence,
            'absences_justifiees': absences_justifiees,
            'absences_non_justifiees': absences_non_justifiees,
            
            # Congé
            'conges_valides': conges_valides,
            'conges_refuses': conges_refuses,
            'conges_en_attente': conges_en_attente,
            'total_jours_conges': total_jours_conges,
            'taux_approbation_conges': round(taux_approbation, 2),
            
            'jours_ouvrables': jours_ouvrables
        }
        
        print(f"✅ [STATS SEMAINE] Stats finales - Jours travaillés: {jours_travailles}, Absences: {jours_absence}")
        return stats
    
    @staticmethod
    def calculate_employee_monthly_stats(employe, mois=None):
        """Calcule les statistiques mensuelles complètes d'un employé"""
        # Convertir le mois en objet date si c'est une string
        if isinstance(mois, str):
            try:
                # Essayer d'abord le format YYYY-MM-DD
                mois = datetime.strptime(mois, '%Y-%m-%d').date().replace(day=1)
            except ValueError:
                try:
                    # Essayer le format YYYY-MM
                    mois = datetime.strptime(mois, '%Y-%m').date().replace(day=1)
                except (ValueError, TypeError):
                    mois = timezone.now().date().replace(day=1)
        
        if not mois:
            mois = timezone.now().date().replace(day=1)
        else:
            # S'assurer que c'est le premier jour du mois
            if hasattr(mois, 'replace'):
                mois = mois.replace(day=1)
        
        start_of_month = mois
        end_of_month = (mois + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # DEBUG: Afficher les dates de filtrage
        print(f"🔍 [STATS MOIS] Employé: {employe.matricule}, Période: {start_of_month} à {end_of_month}")
        
        # === STATISTIQUES POINTAGE ===
        pointages = employe.pointages.filter(
            date_pointage__range=[start_of_month, end_of_month]
        ).exclude(duree_travail=None)
        
        print(f"📊 [STATS MOIS] Pointages trouvés: {pointages.count()}")
        
        total_heures = sum(
            (p.duree_travail for p in pointages if p.duree_travail),
            timedelta()
        )
        
        jours_travailles = pointages.count()
        moyenne_quotidienne = total_heures / jours_travailles if jours_travailles > 0 else timedelta()
        
        # Analyse des retards (entrée après 8h30)
        pointages_reguliers = pointages.filter(heure_entree__lte=time(8, 30)).count()
        pointages_irreguliers = jours_travailles - pointages_reguliers
        
        # === STATISTIQUES ABSENCE ===
        absences = employe.absences.filter(
            date_debut_absence__lte=end_of_month,
            date_fin_absence__gte=start_of_month
        )
        
        print(f"⚠️ [STATS MOIS] Absences trouvées: {absences.count()}")
        
        jours_absence = 0
        absences_justifiees = 0
        absences_non_justifiees = 0
        
        for absence in absences:
            debut = max(absence.date_debut_absence, start_of_month)
            fin = min(absence.date_fin_absence, end_of_month)
            jours_absence_periode = (fin - debut).days + 1
            jours_absence += jours_absence_periode
            
            if absence.justifiee:
                absences_justifiees += jours_absence_periode
            else:
                absences_non_justifiees += jours_absence_periode
        
        # Jours ouvrables dans le mois (approximatif)
        jours_ouvrables = 22
        taux_absence = (jours_absence / jours_ouvrables) * 100 if jours_ouvrables > 0 else 0
        
        # === STATISTIQUES CONGÉ ===
        conges = employe.conges.filter(
            date_debut__lte=end_of_month,
            date_fin__gte=start_of_month
        )
        
        print(f"🏖️ [STATS MOIS] Congés trouvés: {conges.count()}")
        
        conges_valides = conges.filter(statut='valide').count()
        conges_refuses = conges.filter(statut='refuse').count()
        conges_en_attente = conges.filter(statut='en_attente').count()
        
        total_jours_conges = 0
        for conge in conges.filter(statut='valide'):
            debut = max(conge.date_debut, start_of_month)
            fin = min(conge.date_fin, end_of_month)
            total_jours_conges += (fin - debut).days + 1
        
        total_conges_traites = conges_valides + conges_refuses
        taux_approbation = (conges_valides / total_conges_traites * 100) if total_conges_traites > 0 else 0
        
        stats = {
            'employe': employe,
            'periode_debut': start_of_month,
            'periode_fin': end_of_month,
            'type_periode': 'mensuel',
            
            # Pointage
            'heures_travail_total': total_heures,
            'jours_travailles': jours_travailles,
            'moyenne_heures_quotidiennes': moyenne_quotidienne,
            'pointages_reguliers': pointages_reguliers,
            'pointages_irreguliers': pointages_irreguliers,
            
            # Absence
            'taux_absence': round(taux_absence, 2),
            'jours_absence': jours_absence,
            'absences_justifiees': absences_justifiees,
            'absences_non_justifiees': absences_non_justifiees,
            
            # Congé
            'conges_valides': conges_valides,
            'conges_refuses': conges_refuses,
            'conges_en_attente': conges_en_attente,
            'total_jours_conges': total_jours_conges,
            'taux_approbation_conges': round(taux_approbation, 2),
            
            'jours_ouvrables': jours_ouvrables
        }
        
        print(f"✅ [STATS MOIS] Stats finales - Jours travaillés: {jours_travailles}, Absences: {jours_absence}")
        return stats
    
    @staticmethod
    def calculate_department_monthly_stats(departement, mois=None):
        """Calcule les statistiques mensuelles complètes d'un département"""
        # Convertir le mois en objet date si c'est une string
        if isinstance(mois, str):
            try:
                mois = datetime.strptime(mois, '%Y-%m').date().replace(day=1)
            except (ValueError, TypeError):
                mois = timezone.now().date().replace(day=1)
        
        if not mois:
            mois = timezone.now().date().replace(day=1)
        else:
            mois = mois.replace(day=1)
        
        start_of_month = mois
        end_of_month = (mois + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        employes_departement = departement.employes.all()
        total_employes = employes_departement.count()
        employes_actifs = employes_departement.filter(statut='actif').count()
        
        if total_employes == 0:
            stats = {
                'departement': departement,
                'mois': mois,
                'total_employes': 0,
                'employes_actifs': 0,
                'taux_absence_moyen': 0,
                'heures_travail_moyennes': timedelta(),
                'total_heures_travail': timedelta(),
                'pointages_total': 0,
                'total_absences': 0,
                'absences_justifiees': 0,
                'absences_non_justifiees': 0,
                'total_conges_valides': 0,
                'total_conges_refuses': 0,
                'total_conges_en_attente': 0,
                'taux_approbation_conges': 0,
                'evenements_count': 0
            }
            return stats
        
        # Calcul des statistiques agrégées
        total_taux_absence = 0
        total_heures_seconds = 0
        total_pointages = 0
        total_absences = 0
        total_absences_justifiees = 0
        total_absences_non_justifiees = 0
        total_conges_valides = 0
        total_conges_refuses = 0
        total_conges_en_attente = 0
        
        for employe in employes_departement:
            emp_stats = StatisticsService.calculate_employee_monthly_stats(employe, mois)
            
            total_taux_absence += emp_stats['taux_absence']
            total_heures_seconds += emp_stats['heures_travail_total'].total_seconds()
            total_pointages += emp_stats['jours_travailles']
            total_absences += emp_stats['jours_absence']
            total_absences_justifiees += emp_stats['absences_justifiees']
            total_absences_non_justifiees += emp_stats['absences_non_justifiees']
            total_conges_valides += emp_stats['conges_valides']
            total_conges_refuses += emp_stats['conges_refuses']
            total_conges_en_attente += emp_stats['conges_en_attente']
        
        # Calcul des moyennes et totaux
        taux_absence_moyen = total_taux_absence / total_employes
        heures_moyennes = timedelta(seconds=total_heures_seconds / total_employes)
        total_heures_travail = timedelta(seconds=total_heures_seconds)
        
        # Taux d'approbation des congés
        total_conges_traites = total_conges_valides + total_conges_refuses
        taux_approbation_conges = (total_conges_valides / total_conges_traites * 100) if total_conges_traites > 0 else 0
        
        # Événements du mois
        from ..models import Evenement
        evenements_count = Evenement.objects.filter(
            date_debut__gte=start_of_month,
            date_fin__lte=end_of_month
        ).count()
        
        stats = {
            'departement': departement,
            'mois': mois,
            
            # Global
            'total_employes': total_employes,
            'employes_actifs': employes_actifs,
            'taux_absence_moyen': round(taux_absence_moyen, 2),
            'heures_travail_moyennes': heures_moyennes,
            
            # Pointage
            'total_heures_travail': total_heures_travail,
            'pointages_total': total_pointages,
            
            # Absence
            'total_absences': total_absences,
            'absences_justifiees': total_absences_justifiees,
            'absences_non_justifiees': total_absences_non_justifiees,
            
            # Congé
            'total_conges_valides': total_conges_valides,
            'total_conges_refuses': total_conges_refuses,
            'total_conges_en_attente': total_conges_en_attente,
            'taux_approbation_conges': round(taux_approbation_conges, 2),
            
            'evenements_count': evenements_count
        }
        
        return stats
    
    @staticmethod
    def calculate_global_monthly_stats(mois=None):
        """Calcule les statistiques globales mensuelles"""
        # Convertir le mois en objet date si c'est une string
        if isinstance(mois, str):
            try:
                mois = datetime.strptime(mois, '%Y-%m').date().replace(day=1)
            except (ValueError, TypeError):
                mois = timezone.now().date().replace(day=1)
        
        if not mois:
            mois = timezone.now().date().replace(day=1)
        else:
            mois = mois.replace(day=1)
        
        start_of_month = mois
        end_of_month = (mois + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        from ..models import Employe, Departement, Pointage, Absence, Conge, Evenement
        
        # Données de base
        total_employes = Employe.objects.count()
        total_departements = Departement.objects.count()
        employes_actifs = Employe.objects.filter(statut='actif').count()
        
        # === STATISTIQUES POINTAGE ===
        pointages_mois = Pointage.objects.filter(
            date_pointage__range=[start_of_month, end_of_month]
        ).exclude(duree_travail=None)
        
        total_pointages = pointages_mois.count()
        total_heures = sum(
            (p.duree_travail for p in pointages_mois if p.duree_travail),
            timedelta()
        )
        
        # Taux de présence (jours travaillés / jours ouvrables potentiels)
        jours_ouvrables_potentiels = 22 * total_employes  # Approximation
        taux_presence = (total_pointages / jours_ouvrables_potentiels * 100) if jours_ouvrables_potentiels > 0 else 0
        
        # === STATISTIQUES ABSENCE ===
        absences_mois = Absence.objects.filter(
            date_debut_absence__lte=end_of_month,
            date_fin_absence__gte=start_of_month
        )
        
        total_absences = sum(absence.nbr_jours for absence in absences_mois)
        absences_justifiees = sum(absence.nbr_jours for absence in absences_mois.filter(justifiee=True))
        taux_absence_global = (total_absences / jours_ouvrables_potentiels * 100) if jours_ouvrables_potentiels > 0 else 0
        
        # === STATISTIQUES CONGÉ ===
        conges_mois = Conge.objects.filter(
            date_debut__lte=end_of_month,
            date_fin__gte=start_of_month
        )
        
        total_conges = conges_mois.count()
        conges_valides = conges_mois.filter(statut='valide').count()
        conges_refuses = conges_mois.filter(statut='refuse').count()
        taux_validation_conges = (conges_valides / total_conges * 100) if total_conges > 0 else 0
        
        # === STATISTIQUES ÉVÉNEMENTS ===
        total_evenements = Evenement.objects.filter(
            date_debut__gte=start_of_month,
            date_fin__lte=end_of_month
        ).count()
        
        # Taux d'activité global
        taux_activite = (employes_actifs / total_employes * 100) if total_employes > 0 else 0
        
        stats = {
            'periode': mois,
            'type_periode': 'mensuel',
            
            # Global
            'total_employes': total_employes,
            'total_departements': total_departements,
            'taux_activite_global': round(taux_activite, 2),
            
            # Pointage
            'total_pointages': total_pointages,
            'heures_travail_total': total_heures,
            'taux_presence': round(taux_presence, 2),
            
            # Absence
            'total_absences': total_absences,
            'taux_absence_global': round(taux_absence_global, 2),
            'absences_justifiees': absences_justifiees,
            
            # Congé
            'total_conges': total_conges,
            'conges_valides': conges_valides,
            'conges_refuses': conges_refuses,
            'taux_validation_conges': round(taux_validation_conges, 2),
            
            # Événements
            'total_evenements': total_evenements
        }
        
        return stats
    
    @staticmethod
    def get_conge_statistics(employe=None, departement=None, periode=None):
        """Statistiques détaillées sur les congés"""
        from ..models import Conge
        
        queryset = Conge.objects.all()
        
        if employe:
            queryset = queryset.filter(employe=employe)
        if departement:
            queryset = queryset.filter(employe__departement=departement)
        if periode:
            start_date = periode
            end_date = (periode + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            queryset = queryset.filter(
                date_debut__lte=end_date,
                date_fin__gte=start_date
            )
        
        stats = {
            'total': queryset.count(),
            'valides': queryset.filter(statut='valide').count(),
            'refuses': queryset.filter(statut='refuse').count(),
            'en_attente': queryset.filter(statut='en_attente').count(),
            'moyenne_jours': queryset.filter(statut='valide').aggregate(Avg('nbr_jours'))['nbr_jours__avg'] or 0,
            'total_jours_valides': sum(conge.nbr_jours for conge in queryset.filter(statut='valide'))
        }
        
        return stats
    
    @staticmethod
    def get_pointage_statistics(employe=None, departement=None, periode=None):
        """Statistiques détaillées sur les pointages"""
        from ..models import Pointage
        
        queryset = Pointage.objects.exclude(duree_travail=None)
        
        if employe:
            queryset = queryset.filter(employe=employe)
        if departement:
            queryset = queryset.filter(employe__departement=departement)
        if periode:
            start_date = periode
            end_date = (periode + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            queryset = queryset.filter(date_pointage__range=[start_date, end_date])
        
        pointages = list(queryset)
        total_heures = sum((p.duree_travail for p in pointages if p.duree_travail), timedelta())
        
        stats = {
            'total': len(pointages),
            'heures_total': total_heures,
            'moyenne_quotidienne': total_heures / len(pointages) if pointages else timedelta(),
            'pointages_reguliers': len([p for p in pointages if p.heure_entree <= time(8, 30)]),
            'pointages_irreguliers': len([p for p in pointages if p.heure_entree > time(8, 30)]),
        }
        
        return stats
    
    @staticmethod
    def get_absence_statistics(employe=None, departement=None, periode=None):
        """Statistiques détaillées sur les absences"""
        from ..models import Absence
        
        queryset = Absence.objects.all()
        
        if employe:
            queryset = queryset.filter(employe=employe)
        if departement:
            queryset = queryset.filter(employe__departement=departement)
        if periode:
            start_date = periode
            end_date = (periode + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            queryset = queryset.filter(
                date_debut_absence__lte=end_date,
                date_fin_absence__gte=start_date
            )
        
        stats = {
            'total': queryset.count(),
            'jours_total': sum(absence.nbr_jours for absence in queryset),
            'justifiees': queryset.filter(justifiee=True).count(),
            'non_justifiees': queryset.filter(justifiee=False).count(),
            'moyenne_jours': queryset.aggregate(Avg('nbr_jours'))['nbr_jours__avg'] or 0,
            'taux_justification': (queryset.filter(justifiee=True).count() / queryset.count() * 100) if queryset.count() > 0 else 0
        }
        
        return stats
    
    @staticmethod
    def save_employee_stats_to_db(stats_data):
        """Sauvegarde les statistiques employé en base de données"""
        from ..models import StatistiquesEmploye
        
        stats, created = StatistiquesEmploye.objects.update_or_create(
            employe=stats_data['employe'],
            periode_debut=stats_data['periode_debut'],
            periode_fin=stats_data['periode_fin'],
            type_periode=stats_data['type_periode'],
            defaults={
                # Pointage
                'heures_travail_total': stats_data['heures_travail_total'],
                'jours_travailles': stats_data['jours_travailles'],
                'moyenne_heures_quotidiennes': stats_data['moyenne_heures_quotidiennes'],
                'pointages_reguliers': stats_data['pointages_reguliers'],
                'pointages_irreguliers': stats_data['pointages_irreguliers'],
                
                # Absence
                'taux_absence': stats_data['taux_absence'],
                'jours_absence': stats_data['jours_absence'],
                'absences_justifiees': stats_data['absences_justifiees'],
                'absences_non_justifiees': stats_data['absences_non_justifiees'],
                
                # Congé
                'conges_valides': stats_data['conges_valides'],
                'conges_refuses': stats_data['conges_refuses'],
                'conges_en_attente': stats_data['conges_en_attente'],
                'total_jours_conges': stats_data['total_jours_conges'],
                'taux_approbation_conges': stats_data['taux_approbation_conges'],
                
                'jours_ouvrables': stats_data['jours_ouvrables']
            }
        )
        return stats
    
    @staticmethod
    def save_department_stats_to_db(stats_data):
        """Sauvegarde les statistiques département en base de données"""
        from ..models import StatistiquesDepartement
        
        stats, created = StatistiquesDepartement.objects.update_or_create(
            departement=stats_data['departement'],
            mois=stats_data['mois'],
            defaults={
                # Global
                'total_employes': stats_data['total_employes'],
                'employes_actifs': stats_data['employes_actifs'],
                'taux_absence_moyen': stats_data['taux_absence_moyen'],
                'heures_travail_moyennes': stats_data['heures_travail_moyennes'],
                
                # Pointage
                'total_heures_travail': stats_data['total_heures_travail'],
                'pointages_total': stats_data['pointages_total'],
                
                # Absence
                'total_absences': stats_data['total_absences'],
                'absences_justifiees': stats_data['absences_justifiees'],
                'absences_non_justifiees': stats_data['absences_non_justifiees'],
                
                # Congé
                'total_conges_valides': stats_data['total_conges_valides'],
                'total_conges_refuses': stats_data['total_conges_refuses'],
                'total_conges_en_attente': stats_data['total_conges_en_attente'],
                'taux_approbation_conges': stats_data['taux_approbation_conges'],
                
                'evenements_count': stats_data['evenements_count']
            }
        )
        return stats