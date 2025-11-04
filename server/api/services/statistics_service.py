from django.db.models import Q, Count, Avg, Sum
from datetime import timedelta, datetime, time
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class StatisticsService:
    
    @staticmethod
    def calculate_employee_weekly_stats(employe, date_reference=None):
        """Calcule les statistiques hebdomadaires complètes d'un employé"""
        logger.info(f"📊 Calcul stats hebdo pour {employe.matricule}")
        
        # Gestion des dates
        if isinstance(date_reference, str):
            try:
                date_reference = datetime.strptime(date_reference, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                date_reference = timezone.now().date()
        
        date_reference = date_reference or timezone.now().date()
        start_of_week = date_reference - timedelta(days=date_reference.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        logger.info(f"📅 Période: {start_of_week} à {end_of_week}")
        
        # Récupération des pointages
        try:
            pointages = employe.pointages.filter(
                date_pointage__range=[start_of_week, end_of_week]
            ).exclude(duree_travail__isnull=True)
        except AttributeError:
            # Fallback si la relation pointages n'existe pas
            try:
                pointages = employe.pointage_set.filter(
                    date_pointage__range=[start_of_week, end_of_week]
                ).exclude(duree_travail__isnull=True)
            except AttributeError:
                pointages = []
        
        # Calcul des métriques de base
        jours_travailles = pointages.values('date_pointage').distinct().count()
        
        total_heures = timedelta()
        for p in pointages:
            if p.duree_travail:
                total_heures += p.duree_travail
        
        moyenne_quotidienne = total_heures / jours_travailles if jours_travailles > 0 else timedelta()
        
        # Calcul de la ponctualité
        pointages_ponctuels = pointages.filter(heure_entree__lte=time(9, 0)).count()
        pointages_non_ponctuels = max(0, jours_travailles - pointages_ponctuels)
        taux_ponctualite = (pointages_ponctuels / jours_travailles * 100) if jours_travailles > 0 else 0
        
        # Calcul de la régularité
        pointages_reguliers = pointages.filter(heure_entree__lte=time(8, 30)).count()
        pointages_irreguliers = max(0, jours_travailles - pointages_reguliers)
        taux_regularite = (pointages_reguliers / jours_travailles * 100) if jours_travailles > 0 else 0
        
        # Taux de présence
        taux_presence = (jours_travailles / 5 * 100) if 5 > 0 else 0
        
        stats = {
            'employe': employe,
            'periode_debut': start_of_week,
            'periode_fin': end_of_week,
            'type_periode': 'hebdo',
            
            # Métriques de base
            'heures_travail_total': total_heures,
            'jours_travailles': jours_travailles,
            'moyenne_heures_quotidiennes': moyenne_quotidienne,
            
            # Régularité
            'pointages_reguliers': pointages_reguliers,
            'pointages_irreguliers': pointages_irreguliers,
            'taux_regularite': round(taux_regularite, 2),
            
            # Ponctualité
            'pointages_ponctuels': pointages_ponctuels,
            'pointages_non_ponctuels': pointages_non_ponctuels,
            'taux_ponctualite': round(taux_ponctualite, 2),
            
            # Présence
            'taux_presence': round(taux_presence, 2),
            
            'jours_ouvrables': 5
        }
        
        logger.info(f"✅ Stats hebdo calculées - Ponctualité: {taux_ponctualite:.1f}%, Régularité: {taux_regularite:.1f}%")
        return stats
    
    @staticmethod
    def calculate_employee_monthly_stats(employe, mois=None):
        """Calcule les statistiques mensuelles COMPLÈTES avec toutes les données"""
        logger.info(f"📊 Calcul stats mensuelles pour {employe.matricule}")
        
        # Gestion des dates
        if isinstance(mois, str):
            try:
                if len(mois) == 7:  # Format YYYY-MM
                    mois = datetime.strptime(mois, '%Y-%m').date().replace(day=1)
                else:  # Format YYYY-MM-DD
                    mois = datetime.strptime(mois, '%Y-%m-%d').date().replace(day=1)
            except (ValueError, TypeError):
                mois = timezone.now().date().replace(day=1)
        
        mois = (mois or timezone.now().date()).replace(day=1)
        start_of_month = mois
        end_of_month = (mois + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Calcul de la période d'analyse
        today = timezone.now().date()
        if mois > today:
            jours_passes = 0
            date_fin_analyse = start_of_month
        elif mois.month == today.month and mois.year == today.year:
            jours_passes = (today - start_of_month).days + 1
            date_fin_analyse = today
        else:
            jours_passes = (end_of_month - start_of_month).days + 1
            date_fin_analyse = end_of_month
        
        logger.info(f"📅 Période analysée: {start_of_month} à {date_fin_analyse}")
        
        # Récupération des pointages avec fallback de relation
        try:
            pointages = employe.pointages.filter(
                date_pointage__range=[start_of_month, date_fin_analyse]
            ).exclude(duree_travail__isnull=True)
        except AttributeError:
            try:
                pointages = employe.pointage_set.filter(
                    date_pointage__range=[start_of_month, date_fin_analyse]
                ).exclude(duree_travail__isnull=True)
            except AttributeError:
                logger.warning(f"❌ Aucune relation pointages trouvée pour {employe.matricule}")
                pointages = []
        
        logger.info(f"🔍 {pointages.count()} pointages trouvés")
        
        # Jours travaillés distincts
        jours_travailles = pointages.values('date_pointage').distinct().count()
        
        # Calcul des heures totales
        total_heures = timedelta()
        heures_details = []
        
        for p in pointages:
            if p.duree_travail:
                total_heures += p.duree_travail
                heures_details.append({
                    'date': p.date_pointage,
                    'duree': p.duree_travail,
                    'entree': p.heure_entree,
                    'sortie': p.heure_sortie
                })
        
        # Heures attendues réalistes
        jours_ouvrables_passes = min(jours_passes, 22)  # Max 22 jours ouvrables/mois
        heures_attendues = timedelta(hours=8 * jours_ouvrables_passes)
        
        # Calculs des écarts et statut
        total_heures_seconds = total_heures.total_seconds()
        heures_attendues_seconds = heures_attendues.total_seconds()
        
        ecart_seconds = total_heures_seconds - heures_attendues_seconds
        ecart_heures = timedelta(seconds=abs(ecart_seconds))
        pourcentage_ecart = (ecart_seconds / heures_attendues_seconds * 100) if heures_attendues_seconds > 0 else 0
        
        # DÉTERMINATION DU STATUT - TOUJOURS DÉFINI
        if total_heures_seconds == 0:
            statut_heures = 'INSUFFISANT'
        elif pourcentage_ecart < -15:  # Moins de 85% des heures attendues
            statut_heures = 'INSUFFISANT'
        elif pourcentage_ecart > 15:   # Plus de 115% des heures attendues
            statut_heures = 'SURPLUS'
        else:                          # Entre 85% et 115%
            statut_heures = 'NORMAL'
        
        # CALCUL PONCTUALITÉ - Entrée avant 9h00
        pointages_ponctuels = pointages.filter(heure_entree__lte=time(9, 0)).count()
        pointages_non_ponctuels = max(0, jours_travailles - pointages_ponctuels)
        taux_ponctualite = (pointages_ponctuels / jours_travailles * 100) if jours_travailles > 0 else 0
        
        # CALCUL RÉGULARITÉ - Entrée avant 8h30
        pointages_reguliers = pointages.filter(heure_entree__lte=time(8, 30)).count()
        pointages_irreguliers = max(0, jours_travailles - pointages_reguliers)
        taux_regularite = (pointages_reguliers / jours_travailles * 100) if jours_travailles > 0 else 0
        
        # CALCUL TAUX PRÉSENCE
        taux_presence = (jours_travailles / jours_ouvrables_passes * 100) if jours_ouvrables_passes > 0 else 0
        
        # Moyenne quotidienne
        moyenne_quotidienne = total_heures / jours_travailles if jours_travailles > 0 else timedelta()
        
        # Génération de l'observation
        observation = StatisticsService._generer_observation(
            statut_heures, total_heures, heures_attendues, ecart_heures,
            jours_passes, jours_travailles, taux_ponctualite, taux_regularite, taux_presence
        )
        
        # Construction des statistiques complètes
        stats = {
            'employe': employe,
            'periode_debut': start_of_month,
            'periode_fin': end_of_month,
            'type_periode': 'mensuel',
            
            # Métriques de base
            'heures_travail_total': total_heures,
            'jours_travailles': jours_travailles,
            'moyenne_heures_quotidiennes': moyenne_quotidienne,
            
            # Régularité
            'pointages_reguliers': pointages_reguliers,
            'pointages_irreguliers': pointages_irreguliers,
            'taux_regularite': round(taux_regularite, 2),
            
            # Analyse des heures
            'jours_passes_mois': jours_passes,
            'heures_attendues_jours_passes': heures_attendues,
            'statut_heures': statut_heures,
            'ecart_heures': ecart_heures,
            'pourcentage_ecart': round(pourcentage_ecart, 2),
            'observation_heures': observation,
            
            # Ponctualité
            'pointages_ponctuels': pointages_ponctuels,
            'pointages_non_ponctuels': pointages_non_ponctuels,
            'taux_ponctualite': round(taux_ponctualite, 2),
            
            # Présence
            'taux_presence': round(taux_presence, 2),
            
            'jours_ouvrables': 22,
            
            # Données de debug (optionnel)
            '_debug': {
                'pointages_count': pointages.count(),
                'heures_details': heures_details[:5],  # Premier 5 pour debug
                'calcul_timestamp': timezone.now().isoformat()
            }
        }
        
        logger.info(f"✅ Stats mensuelles calculées - "
                   f"Statut: {statut_heures}, "
                   f"Ponctualité: {taux_ponctualite:.1f}%, "
                   f"Régularité: {taux_regularite:.1f}%, "
                   f"Présence: {taux_presence:.1f}%")
        
        return stats
    
    @staticmethod
    def _generer_observation(statut, heures_reelles, heures_attendues, ecart, 
                           jours_passes, jours_travailles, taux_ponctualite, taux_regularite, taux_presence):
        """Génère une observation détaillée et professionnelle"""
        
        def format_duration(td):
            if not td:
                return "0h 00min"
            total_seconds = int(td.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return f"{hours}h {minutes:02d}min"
        
        heures_reelles_str = format_duration(heures_reelles)
        heures_attendues_str = format_duration(heures_attendues)
        ecart_str = format_duration(ecart)
        
        if statut == 'INSUFFISANT':
            return (f"⚠️ **Heures INSUFFISANTES** - Avec {jours_passes} jours passés dans le mois, "
                    f"l'employé a travaillé {heures_reelles_str} sur {heures_attendues_str} attendues "
                    f"({jours_travailles} jours travaillés). "
                    f"**Déficit**: {ecart_str}. "
                    f"Ponctualité: {taux_ponctualite:.1f}%, Régularité: {taux_regularite:.1f}%, Présence: {taux_presence:.1f}%")
        
        elif statut == 'NORMAL':
            return (f"✅ **Performances CONFORMES** - Sur {jours_passes} jours passés, "
                    f"l'employé a travaillé {heures_reelles_str} "
                    f"({jours_travailles} jours travaillés). "
                    f"**Ponctualité**: {taux_ponctualite:.1f}%, "
                    f"**Régularité**: {taux_regularite:.1f}%, "
                    f"**Présence**: {taux_presence:.1f}%")
        
        elif statut == 'SURPLUS':
            return (f"📈 **Heures en SURPLUS** - Avec {jours_passes} jours passés, "
                    f"l'employé a travaillé {heures_reelles_str} "
                    f"sur {heures_attendues_str} attendues ({jours_travailles} jours travaillés). "
                    f"**Excédent**: {ecart_str}. "
                    f"Ponctualité: {taux_ponctualite:.1f}%, Régularité: {taux_regularite:.1f}%, Présence: {taux_presence:.1f}%")
        
        else:
            return f"📊 Analyse en cours - Ponctualité: {taux_ponctualite:.1f}%, Présence: {taux_presence:.1f}%"
    
    @staticmethod
    def calculate_global_monthly_stats(mois=None):
        """Calcule les statistiques globales mensuelles"""
        from ..models import Employe, Departement, Pointage, Evenement
        
        # Gestion des dates
        if isinstance(mois, str):
            try:
                mois = datetime.strptime(mois, '%Y-%m').date().replace(day=1)
            except (ValueError, TypeError):
                mois = timezone.now().date().replace(day=1)
        
        mois = (mois or timezone.now().date()).replace(day=1)
        start_of_month = mois
        end_of_month = (mois + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Données de base
        total_employes = Employe.objects.count()
        employes_actifs = Employe.objects.filter(statut='actif').count()
        total_departements = Departement.objects.count()
        
        # Statistiques pointages
        pointages_mois = Pointage.objects.filter(
            date_pointage__range=[start_of_month, end_of_month]
        ).exclude(duree_travail__isnull=True)
        
        total_pointages = pointages_mois.count()
        
        # Calcul heures totales
        total_heures = timedelta()
        for p in pointages_mois:
            if p.duree_travail:
                total_heures += p.duree_travail
        
        # Métriques globales
        pointages_reguliers = pointages_mois.filter(heure_entree__lte=time(8, 30)).count()
        pointages_ponctuels = pointages_mois.filter(heure_entree__lte=time(9, 0)).count()
        
        # Taux calculés
        taux_activite = (employes_actifs / total_employes * 100) if total_employes > 0 else 0
        taux_regularite_global = (pointages_reguliers / total_pointages * 100) if total_pointages > 0 else 0
        taux_ponctualite_global = (pointages_ponctuels / total_pointages * 100) if total_pointages > 0 else 0
        
        # Taux de présence approximatif
        jours_ouvrables_potentiels = 22 * total_employes
        taux_presence = (total_pointages / jours_ouvrables_potentiels * 100) if jours_ouvrables_potentiels > 0 else 0
        
        # Événements
        total_evenements = Evenement.objects.filter(
            date_debut__gte=start_of_month,
            date_fin__lte=end_of_month
        ).count()
        
        stats = {
            'periode': mois,
            'type_periode': 'mensuel',
            
            # Global
            'total_employes': total_employes,
            'employes_actifs': employes_actifs,
            'total_departements': total_departements,
            'departements_actifs': total_departements,  # Approximation
            'taux_activite_global': round(taux_activite, 2),
            
            # Pointage
            'total_pointages': total_pointages,
            'pointages_reguliers': pointages_reguliers,
            'pointages_ponctuels': pointages_ponctuels,
            'heures_travail_total': total_heures,
            'moyenne_heures_quotidiennes': total_heures / total_pointages if total_pointages > 0 else timedelta(),
            'taux_presence': round(taux_presence, 2),
            'taux_regularite_global': round(taux_regularite_global, 2),
            'taux_ponctualite_global': round(taux_ponctualite_global, 2),
            
            # Événements
            'total_evenements': total_evenements
        }
        
        logger.info(f"🌐 Stats globales calculées - {total_employes} employés, {total_pointages} pointages")
        return stats
    
    @staticmethod
    def save_employee_stats_to_db(stats_data):
        """Sauvegarde les statistiques employé en base de données"""
        try:
            from ..models import StatistiquesEmploye
            
            stats, created = StatistiquesEmploye.objects.update_or_create(
                employe=stats_data['employe'],
                periode_debut=stats_data['periode_debut'],
                periode_fin=stats_data['periode_fin'],
                type_periode=stats_data['type_periode'],
                defaults={
                    # Métriques de base
                    'heures_travail_total': stats_data['heures_travail_total'],
                    'jours_travailles': stats_data['jours_travailles'],
                    'moyenne_heures_quotidiennes': stats_data['moyenne_heures_quotidiennes'],
                    
                    # Régularité
                    'pointages_reguliers': stats_data['pointages_reguliers'],
                    'pointages_irreguliers': stats_data['pointages_irreguliers'],
                    'taux_regularite': stats_data.get('taux_regularite', 0),
                    
                    # Ponctualité
                    'pointages_ponctuels': stats_data.get('pointages_ponctuels', 0),
                    'pointages_non_ponctuels': stats_data.get('pointages_non_ponctuels', 0),
                    'taux_ponctualite': stats_data.get('taux_ponctualite', 0),
                    
                    # Présence
                    'taux_presence': stats_data.get('taux_presence', 0),
                    
                    'jours_ouvrables': stats_data['jours_ouvrables']
                }
            )
            logger.info(f"💾 Stats sauvegardées pour {stats_data['employe'].matricule}")
            return stats
            
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde stats: {e}")
            return None
    
    @staticmethod
    def get_employee_stats_with_fallback(employe, periode_type='mois', date_reference=None):
        """Récupère les stats avec fallback si calcul échoue"""
        try:
            if periode_type == 'semaine':
                return StatisticsService.calculate_employee_weekly_stats(employe, date_reference)
            else:
                return StatisticsService.calculate_employee_monthly_stats(employe, date_reference)
        except Exception as e:
            logger.error(f"❌ Erreur calcul stats pour {employe.matricule}: {e}")
            # Retourner des stats minimales plutôt que d'échouer
            return {
                'employe': employe,
                'periode_debut': timezone.now().date(),
                'periode_fin': timezone.now().date(),
                'type_periode': periode_type,
                'heures_travail_total': timedelta(),
                'jours_travailles': 0,
                'taux_regularite': 0,
                'taux_ponctualite': 0,
                'taux_presence': 0,
                'statut_heures': 'NON_DEFINI',
                'observation_heures': 'Erreur lors du calcul des statistiques'
            }