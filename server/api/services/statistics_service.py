from django.db.models import Q, Count, Avg, Sum, DurationField
from django.db.models.functions import ExtractHour, ExtractMinute, Cast
from datetime import timedelta, datetime, time
from django.utils import timezone
from django.core.cache import cache
import json

class StatisticsService:
    
    @staticmethod
    def calculate_employee_weekly_stats(employe, date_reference=None):
        """Calcule les statistiques hebdomadaires complètes d'un employé (SANS ABSENCES)"""
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
        
        # Taux de régularité (remplace les absences)
        taux_regularite = (
            (pointages_reguliers / jours_travailles * 100) 
            if jours_travailles > 0 
            else 0
        )
        
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
        
        # Jours ouvrables dans la semaine (5 jours)
        jours_ouvrables = 5
        
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
            'taux_regularite': round(taux_regularite, 2),
            
            # Congé (SANS ABSENCES)
            'conges_valides': conges_valides,
            'conges_refuses': conges_refuses,
            'conges_en_attente': conges_en_attente,
            'total_jours_conges': total_jours_conges,
            'taux_approbation_conges': round(taux_approbation, 2),
            
            'jours_ouvrables': jours_ouvrables
        }
        
        print(f"✅ [STATS SEMAINE] Stats finales - Jours travaillés: {jours_travailles}, Régularité: {taux_regularite}%")
        return stats
    
    @staticmethod
    def calculate_employee_monthly_stats(employe, mois=None):
        """Calcule les statistiques mensuelles complètes d'un employé (SANS ABSENCES)"""
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
        
        # Taux de régularité (remplace les absences)
        taux_regularite = (
            (pointages_reguliers / jours_travailles * 100) 
            if jours_travailles > 0 
            else 0
        )
        
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
        
        # Jours ouvrables dans le mois (approximatif)
        jours_ouvrables = 22
        
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
            'taux_regularite': round(taux_regularite, 2),
            
            # Congé (SANS ABSENCES)
            'conges_valides': conges_valides,
            'conges_refuses': conges_refuses,
            'conges_en_attente': conges_en_attente,
            'total_jours_conges': total_jours_conges,
            'taux_approbation_conges': round(taux_approbation, 2),
            
            'jours_ouvrables': jours_ouvrables
        }
        
        print(f"✅ [STATS MOIS] Stats finales - Jours travaillés: {jours_travailles}, Régularité: {taux_regularite}%")
        return stats
    
    @staticmethod
    def calculate_department_monthly_stats(departement, mois=None):
        """Calcule les statistiques mensuelles complètes d'un département (SANS ABSENCES)"""
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
                'taux_regularite_moyen': 0,
                'heures_travail_moyennes': timedelta(),
                'total_heures_travail': timedelta(),
                'pointages_total': 0,
                'total_conges_valides': 0,
                'total_conges_refuses': 0,
                'total_conges_en_attente': 0,
                'taux_approbation_conges': 0,
                'evenements_count': 0
            }
            return stats
        
        # Calcul des statistiques agrégées
        total_taux_regularite = 0
        total_heures_seconds = 0
        total_pointages = 0
        total_conges_valides = 0
        total_conges_refuses = 0
        total_conges_en_attente = 0
        
        for employe in employes_departement:
            emp_stats = StatisticsService.calculate_employee_monthly_stats(employe, mois)
            
            total_taux_regularite += emp_stats['taux_regularite']
            total_heures_seconds += emp_stats['heures_travail_total'].total_seconds()
            total_pointages += emp_stats['jours_travailles']
            total_conges_valides += emp_stats['conges_valides']
            total_conges_refuses += emp_stats['conges_refuses']
            total_conges_en_attente += emp_stats['conges_en_attente']
        
        # Calcul des moyennes et totaux
        taux_regularite_moyen = total_taux_regularite / total_employes
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
            'taux_regularite_moyen': round(taux_regularite_moyen, 2),
            'heures_travail_moyennes': heures_moyennes,
            
            # Pointage
            'total_heures_travail': total_heures_travail,
            'pointages_total': total_pointages,
            
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
        """Calcule les statistiques globales mensuelles (SANS ABSENCES)"""
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
        
        from ..models import Employe, Departement, Pointage, Conge, Evenement
        
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
        
        # Pointages réguliers
        pointages_reguliers = pointages_mois.filter(heure_entree__lte=time(8, 30)).count()
        
        # Taux de présence (jours travaillés / jours ouvrables potentiels)
        jours_ouvrables_potentiels = 22 * total_employes  # Approximation
        taux_presence = (total_pointages / jours_ouvrables_potentiels * 100) if jours_ouvrables_potentiels > 0 else 0
        
        # Taux de régularité global (remplace les absences)
        taux_regularite_global = (
            (pointages_reguliers / total_pointages * 100) 
            if total_pointages > 0 
            else 0
        )
        
        # === STATISTIQUES CONGÉ ===
        conges_mois = Conge.objects.filter(
            date_debut__lte=end_of_month,
            date_fin__gte=start_of_month
        )
        
        total_conges = conges_mois.count()
        conges_valides = conges_mois.filter(statut='valide').count()
        conges_refuses = conges_mois.filter(statut='refuse').count()
        conges_en_attente = conges_mois.filter(statut='en_attente').count()
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
            'employes_actifs': employes_actifs,
            'total_departements': total_departements,
            'departements_actifs': total_departements,  # Estimation
            'taux_activite_global': round(taux_activite, 2),
            
            # Pointage
            'total_pointages': total_pointages,
            'pointages_reguliers': pointages_reguliers,
            'heures_travail_total': total_heures,
            'moyenne_heures_quotidiennes': total_heures / total_pointages if total_pointages > 0 else timedelta(),
            'taux_presence': round(taux_presence, 2),
            'taux_regularite_global': round(taux_regularite_global, 2),
            
            # Congé (SANS ABSENCES)
            'total_conges': total_conges,
            'conges_valides': conges_valides,
            'conges_refuses': conges_refuses,
            'conges_en_attente': conges_en_attente,
            'taux_validation_conges': round(taux_validation_conges, 2),
            
            # Événements
            'total_evenements': total_evenements
        }
        
        return stats
    
    @staticmethod
    def get_conge_statistics(employe=None, departement=None, periode=None):
        """Statistiques détaillées sur les congés (SANS ABSENCES)"""
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
        """Statistiques détaillées sur les pointages (SANS ABSENCES)"""
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
    def save_employee_stats_to_db(stats_data):
        """Sauvegarde les statistiques employé en base de données (SANS ABSENCES)"""
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
                'taux_regularite': stats_data.get('taux_regularite', 0),
                
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