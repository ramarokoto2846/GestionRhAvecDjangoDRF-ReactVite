# statistics_service.py
from django.db.models import Q, Count, Avg, Sum
from datetime import timedelta, datetime, time, date
from django.utils import timezone
from django.core.cache import cache
import logging
import calendar

logger = logging.getLogger(__name__)

class StatisticsService:
    
    @staticmethod
    def _calculer_ponctualite_pointage(pointage, employe):
        """Calcule la ponctualité d'un pointage spécifique"""
        if not pointage.heure_entree or not pointage.heure_sortie:
            return None
        
        # Heures attendues de l'employé
        heure_entree_attendue = employe.heure_entree_attendue or time(8, 0)
        heure_sortie_attendue = employe.heure_sortie_attendue or time(16, 0)
        marge = employe.marge_tolerance_minutes or 10
        
        # Calcul du retard à l'entrée
        entree_attendu_minutes = heure_entree_attendue.hour * 60 + heure_entree_attendue.minute
        entree_reelle_minutes = pointage.heure_entree.hour * 60 + pointage.heure_entree.minute
        
        retard_minutes = max(0, entree_reelle_minutes - entree_attendu_minutes)
        entree_ponctuelle = retard_minutes <= marge
        
        # Calcul du départ anticipé
        sortie_attendu_minutes = heure_sortie_attendue.hour * 60 + heure_sortie_attendue.minute
        sortie_reelle_minutes = pointage.heure_sortie.hour * 60 + pointage.heure_sortie.minute
        
        depart_avance_minutes = max(0, sortie_attendu_minutes - sortie_reelle_minutes)
        sortie_ponctuelle = depart_avance_minutes <= marge
        
        # Déterminer la catégorie de ponctualité
        if entree_ponctuelle and sortie_ponctuelle:
            categorie = 'parfait'
        elif retard_minutes <= 30 and depart_avance_minutes <= 30:
            categorie = 'acceptable'
        else:
            categorie = 'inacceptable'
        
        return {
            'categorie': categorie,
            'retard_minutes': retard_minutes,
            'depart_avance_minutes': depart_avance_minutes,
            'entree_ponctuelle': entree_ponctuelle,
            'sortie_ponctuelle': sortie_ponctuelle
        }
    
    @staticmethod
    def _calculer_regularite_statut(ponctualite_parfaite, ponctualite_acceptable, ponctualite_inacceptable):
        """Calcule le statut de régularité basé sur la distribution de ponctualité"""
        total = ponctualite_parfaite + ponctualite_acceptable + ponctualite_inacceptable
        
        if total == 0:
            return 'acceptable'
        
        pourcentage_parfait = (ponctualite_parfaite / total) * 100
        pourcentage_acceptable = (ponctualite_acceptable / total) * 100
        
        if pourcentage_parfait >= 80:
            return 'parfait'
        elif pourcentage_parfait >= 60 or (pourcentage_parfait + pourcentage_acceptable) >= 90:
            return 'acceptable'
        else:
            return 'inacceptable'
    
    @staticmethod
    def calculate_employee_weekly_stats(employe, date_reference=None):
        """Calcule les statistiques hebdomadaires avec nouveau système de ponctualité"""
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
            try:
                pointages = employe.pointage_set.filter(
                    date_pointage__range=[start_of_week, end_of_week]
                ).exclude(duree_travail__isnull=True)
            except AttributeError:
                pointages = []
        
        # Jours travaillés distincts
        jours_travailles = pointages.values('date_pointage').distinct().count()
        
        # Calcul des jours dans la semaine (7 jours)
        jours_total_semaine = 7
        
        # Calcul des absences
        jours_absents = max(0, jours_total_semaine - jours_travailles)
        
        # Calcul des heures totales
        total_heures = timedelta()
        retard_total = 0
        depart_avance_total = 0
        
        # Compteurs de ponctualité
        ponctualite_parfaite = 0
        ponctualite_acceptable = 0
        ponctualite_inacceptable = 0
        
        # Analyse de chaque pointage
        for p in pointages:
            if p.duree_travail:
                total_heures += p.duree_travail
            
            # Calculer la ponctualité
            ponctualite = StatisticsService._calculer_ponctualite_pointage(p, employe)
            if ponctualite:
                if ponctualite['categorie'] == 'parfait':
                    ponctualite_parfaite += 1
                elif ponctualite['categorie'] == 'acceptable':
                    ponctualite_acceptable += 1
                else:
                    ponctualite_inacceptable += 1
                
                retard_total += ponctualite['retard_minutes']
                depart_avance_total += ponctualite['depart_avance_minutes']
        
        # Calcul des moyennes
        retard_moyen = retard_total / jours_travailles if jours_travailles > 0 else 0
        depart_avance_moyen = depart_avance_total / jours_travailles if jours_travailles > 0 else 0
        
        # Calcul de la régularité
        regularite_statut = StatisticsService._calculer_regularite_statut(
            ponctualite_parfaite, ponctualite_acceptable, ponctualite_inacceptable
        )
        
        # Taux de régularité
        taux_regularite = (ponctualite_parfaite / jours_travailles * 100) if jours_travailles > 0 else 0
        
        # Moyenne quotidienne
        moyenne_quotidienne = total_heures / jours_travailles if jours_travailles > 0 else timedelta()
        
        # Taux de présence et absence
        taux_presence = (jours_travailles / jours_total_semaine * 100) if jours_total_semaine > 0 else 0
        taux_absence = (jours_absents / jours_total_semaine * 100) if jours_total_semaine > 0 else 0
        
        # Génération de l'observation
        observation = StatisticsService._generer_observation_hebdo(
            jours_travailles, jours_absents, total_heures,
            ponctualite_parfaite, ponctualite_acceptable, ponctualite_inacceptable,
            regularite_statut, taux_presence, taux_absence
        )
        
        stats = {
            'employe': employe,
            'periode_debut': start_of_week,
            'periode_fin': end_of_week,
            'type_periode': 'hebdo',
            
            # Métriques de base
            'heures_travail_total': total_heures,
            'jours_travailles': jours_travailles,
            'jours_absents': jours_absents,
            'moyenne_heures_quotidiennes': moyenne_quotidienne,
            
            # Ponctualité détaillée
            'ponctualite_parfaite': ponctualite_parfaite,
            'ponctualite_acceptable': ponctualite_acceptable,
            'ponctualite_inacceptable': ponctualite_inacceptable,
            'retard_moyen_minutes': round(retard_moyen, 1),
            'depart_avance_moyen_minutes': round(depart_avance_moyen, 1),
            
            # Régularité
            'regularite_statut': regularite_statut,
            'taux_regularite': round(taux_regularite, 2),
            
            # Présence et absence
            'taux_presence': round(taux_presence, 2),
            'taux_absence': round(taux_absence, 2),
            
            'jours_total': jours_total_semaine,
            'observation_heures': observation
        }
        
        logger.info(f"✅ Stats hebdo calculées - "
                   f"Ponctualité: {ponctualite_parfaite}/{ponctualite_acceptable}/{ponctualite_inacceptable}")
        return stats
    
    @staticmethod
    def _generer_observation_hebdo(jours_travailles, jours_absents, total_heures,
                                  ponctualite_parfaite, ponctualite_acceptable, 
                                  ponctualite_inacceptable, regularite_statut,
                                  taux_presence, taux_absence):
        """Génère une observation pour la semaine"""
        
        def format_duration(td):
            if not td:
                return "0h 00min"
            total_seconds = int(td.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return f"{hours}h {minutes:02d}min"
        
        heures_str = format_duration(total_heures)
        total_jours = ponctualite_parfaite + ponctualite_acceptable + ponctualite_inacceptable
        
        if total_jours > 0:
            taux_parfait = (ponctualite_parfaite / total_jours) * 100
            taux_acceptable = (ponctualite_acceptable / total_jours) * 100
        else:
            taux_parfait = taux_acceptable = 0
        
        absences_text = f"avec {jours_absents} jour(s) d'absence. " if jours_absents > 0 else ""
        regularite_text = f"**Régularité**: {regularite_statut.upper()} "
        
        return (f"📅 **Semaine analysée** - {absences_text}"
                f"L'employé a travaillé {jours_travailles} jour(s) ({heures_str}). "
                f"**Ponctualité**: {ponctualite_parfaite} parfait, "
                f"{ponctualite_acceptable} acceptable, {ponctualite_inacceptable} inacceptable. "
                f"{regularite_text}"
                f"**Présence**: {taux_presence:.1f}%, "
                f"**Absence**: {taux_absence:.1f}%")
    
    @staticmethod
    def calculate_employee_monthly_stats(employe, mois=None):
        """Calcule les statistiques mensuelles avec nouveau système de ponctualité"""
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
        
        # Récupération des pointages
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
        
        # Calcul des jours passés dans le mois (tous les jours, pas seulement ouvrables)
        jours_total_passes = jours_passes
        
        # Calcul des absences
        jours_absents = max(0, jours_total_passes - jours_travailles)
        
        # Calcul des heures totales
        total_heures = timedelta()
        retard_total = 0
        depart_avance_total = 0
        
        # Compteurs de ponctualité
        ponctualite_parfaite = 0
        ponctualite_acceptable = 0
        ponctualite_inacceptable = 0
        
        # Analyse de chaque pointage
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
            
            # Calculer la ponctualité
            ponctualite = StatisticsService._calculer_ponctualite_pointage(p, employe)
            if ponctualite:
                if ponctualite['categorie'] == 'parfait':
                    ponctualite_parfaite += 1
                elif ponctualite['categorie'] == 'acceptable':
                    ponctualite_acceptable += 1
                else:
                    ponctualite_inacceptable += 1
                
                retard_total += ponctualite['retard_minutes']
                depart_avance_total += ponctualite['depart_avance_minutes']
        
        # Calcul des moyennes
        retard_moyen = retard_total / jours_travailles if jours_travailles > 0 else 0
        depart_avance_moyen = depart_avance_total / jours_travailles if jours_travailles > 0 else 0
        
        # Heures attendues (8h par jour total passé)
        heures_attendues = timedelta(hours=8 * jours_total_passes)
        
        # Calcul des écarts et statut
        total_heures_seconds = total_heures.total_seconds()
        heures_attendues_seconds = heures_attendues.total_seconds()
        
        ecart_seconds = total_heures_seconds - heures_attendues_seconds
        ecart_heures = timedelta(seconds=abs(ecart_seconds))
        pourcentage_ecart = (ecart_seconds / heures_attendues_seconds * 100) if heures_attendues_seconds > 0 else 0
        
        # Détermination du statut des heures
        if total_heures_seconds == 0:
            statut_heures = 'INSUFFISANT'
        elif pourcentage_ecart < -15:  # Moins de 85% des heures attendues
            statut_heures = 'INSUFFISANT'
        elif pourcentage_ecart > 15:   # Plus de 115% des heures attendues
            statut_heures = 'SURPLUS'
        else:                          # Entre 85% et 115%
            statut_heures = 'NORMAL'
        
        # Calcul de la régularité
        regularite_statut = StatisticsService._calculer_regularite_statut(
            ponctualite_parfaite, ponctualite_acceptable, ponctualite_inacceptable
        )
        
        # Taux de régularité
        taux_regularite = (ponctualite_parfaite / jours_travailles * 100) if jours_travailles > 0 else 0
        
        # Taux de présence et absence
        taux_presence = (jours_travailles / jours_total_passes * 100) if jours_total_passes > 0 else 0
        taux_absence = (jours_absents / jours_total_passes * 100) if jours_total_passes > 0 else 0
        
        # Moyenne quotidienne
        moyenne_quotidienne = total_heures / jours_travailles if jours_travailles > 0 else timedelta()
        
        # Génération de l'observation
        observation = StatisticsService._generer_observation_mensuel(
            statut_heures, total_heures, heures_attendues, ecart_heures,
            jours_passes, jours_travailles, jours_absents, jours_total_passes,
            ponctualite_parfaite, ponctualite_acceptable, ponctualite_inacceptable,
            regularite_statut, retard_moyen, depart_avance_moyen,
            taux_presence, taux_absence
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
            'jours_absents': jours_absents,
            'moyenne_heures_quotidiennes': moyenne_quotidienne,
            
            # Ponctualité détaillée
            'ponctualite_parfaite': ponctualite_parfaite,
            'ponctualite_acceptable': ponctualite_acceptable,
            'ponctualite_inacceptable': ponctualite_inacceptable,
            'retard_moyen_minutes': round(retard_moyen, 1),
            'depart_avance_moyen_minutes': round(depart_avance_moyen, 1),
            
            # Régularité
            'regularite_statut': regularite_statut,
            'taux_regularite': round(taux_regularite, 2),
            
            # Analyse des heures
            'jours_passes_mois': jours_passes,
            'jours_total_passes': jours_total_passes,
            'heures_attendues_jours_passes': heures_attendues,
            'statut_heures': statut_heures,
            'ecart_heures': ecart_heures,
            'pourcentage_ecart': round(pourcentage_ecart, 2),
            'observation_heures': observation,
            
            # Présence et absence
            'taux_presence': round(taux_presence, 2),
            'taux_absence': round(taux_absence, 2),
            
            # Données de debug
            '_debug': {
                'pointages_count': pointages.count(),
                'heures_details': heures_details[:5],
                'calcul_timestamp': timezone.now().isoformat()
            }
        }
        
        logger.info(f"✅ Stats mensuelles calculées - "
                   f"Ponctualité: {ponctualite_parfaite}/{ponctualite_acceptable}/{ponctualite_inacceptable}, "
                   f"Régularité: {regularite_statut}")
        
        return stats
    
    @staticmethod
    def _generer_observation_mensuel(statut, heures_reelles, heures_attendues, ecart, 
                                   jours_passes, jours_travailles, jours_absents, jours_total_passes,
                                   ponctualite_parfaite, ponctualite_acceptable, ponctualite_inacceptable,
                                   regularite_statut, retard_moyen, depart_avance_moyen,
                                   taux_presence, taux_absence):
        """Génère une observation détaillée avec nouveau système de ponctualité"""
        
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
        
        # Information sur les absences
        absences_info = f"⚠️ **{jours_absents} jour(s) d'absence** sur {jours_total_passes} jours. " if jours_absents > 0 else ""
        
        # Information sur la ponctualité
        total_jours = ponctualite_parfaite + ponctualite_acceptable + ponctualite_inacceptable
        ponctualite_info = (f"**Ponctualité**: {ponctualite_parfaite} parfait, "
                          f"{ponctualite_acceptable} acceptable, {ponctualite_inacceptable} inacceptable. "
                          f"Retard moyen: {retard_moyen:.1f} min, "
                          f"Départ moyen: {depart_avance_moyen:.1f} min. ")
        
        if statut == 'INSUFFISANT':
            return (f"{absences_info}"
                    f"📉 **Heures INSUFFISANTES** - "
                    f"L'employé a travaillé {jours_travailles} jour(s) sur {jours_passes} jours passés "
                    f"({heures_reelles_str} sur {heures_attendues_str} attendues). "
                    f"**Déficit**: {ecart_str}. "
                    f"{ponctualite_info}"
                    f"**Régularité**: {regularite_statut.upper()}. "
                    f"Présence: {taux_presence:.1f}%, Absence: {taux_absence:.1f}%")
        
        elif statut == 'NORMAL':
            return (f"{absences_info}"
                    f"✅ **Performances CONFORMES** - "
                    f"Sur {jours_passes} jours passés, "
                    f"l'employé a travaillé {jours_travailles} jour(s) ({heures_reelles_str}). "
                    f"{ponctualite_info}"
                    f"**Régularité**: {regularite_statut.upper()}. "
                    f"Présence: {taux_presence:.1f}%, Absence: {taux_absence:.1f}%")
        
        elif statut == 'SURPLUS':
            return (f"{absences_info}"
                    f"📈 **Heures en SURPLUS** - "
                    f"Avec {jours_passes} jours passés, "
                    f"l'employé a travaillé {jours_travailles} jour(s) "
                    f"({heures_reelles_str} sur {heures_attendues_str} attendues). "
                    f"**Excédent**: {ecart_str}. "
                    f"{ponctualite_info}"
                    f"**Régularité**: {regularite_statut.upper()}. "
                    f"Présence: {taux_presence:.1f}%, Absence: {taux_absence:.1f}%")
        
        else:
            return (f"📊 Analyse en cours - {absences_info}"
                    f"{ponctualite_info}"
                    f"Régularité: {regularite_statut.upper()}. "
                    f"Présence: {taux_presence:.1f}%, Absence: {taux_absence:.1f}%")

    @staticmethod
    def calculate_global_monthly_stats(mois=None):
        """Calcule les statistiques globales mensuelles pour TOUS les employés avec départements"""
        from ..models import Employe, Departement, Pointage
        
        # Gestion des dates
        if isinstance(mois, str):
            try:
                mois = datetime.strptime(mois, '%Y-%m').date().replace(day=1)
            except (ValueError, TypeError):
                mois = timezone.now().date().replace(day=1)
        
        mois = (mois or timezone.now().date()).replace(day=1)
        start_of_month = mois
        end_of_month = (mois + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Calcul de la période d'analyse (jours passés dans le mois)
        today = timezone.now().date()
        if mois > today:
            jours_passes_mois = 0
            date_fin_analyse = start_of_month
        elif mois.month == today.month and mois.year == today.year:
            jours_passes_mois = (today - start_of_month).days + 1
            date_fin_analyse = today
        else:
            jours_passes_mois = (end_of_month - start_of_month).days + 1
            date_fin_analyse = end_of_month
        
        logger.info(f"📅 Période analysée globale: {start_of_month} à {date_fin_analyse} ({jours_passes_mois} jours)")
        
        # 1. DONNÉES DE BASE - TOUS LES EMPLOYÉS
        total_employes = Employe.objects.count()
        employes_actifs = Employe.objects.filter(statut='actif').count()
        
        # 2. DONNÉES DES DÉPARTEMENTS
        total_departements = Departement.objects.count()
        
        # Récupérer tous les départements avec leurs statistiques
        departements_data = []
        departements_actifs_count = 0
        
        for departement in Departement.objects.all():
            # Compter les employés actifs dans le département
            employes_departement = departement.employes.filter(statut='actif').count()
            
            # Récupérer les pointages pour ce département
            employes_departement_ids = departement.employes.values_list('cin', flat=True)
            pointages_departement = Pointage.objects.filter(
                employe__cin__in=employes_departement_ids,
                date_pointage__range=[start_of_month, date_fin_analyse]
            ).exclude(duree_travail__isnull=True)
            
            # Calculer les heures pour ce département
            heures_departement = timedelta()
            for p in pointages_departement:
                if p.duree_travail:
                    heures_departement += p.duree_travail
            
            departements_data.append({
                'id': departement.id_departement,
                'nom': departement.nom,
                'employes_count': departement.employes.count(),
                'employes_actifs': employes_departement,
                'pointages_count': pointages_departement.count(),
                'heures_travail': heures_departement,
                'est_actif': employes_departement > 0
            })
            
            if employes_departement > 0:
                departements_actifs_count += 1
        
        # 3. POINTAGES POUR TOUS LES EMPLOYÉS ACTIFS
        pointages_mois = Pointage.objects.filter(
            date_pointage__range=[start_of_month, date_fin_analyse]
        ).exclude(duree_travail__isnull=True).select_related('employe')
        
        total_pointages = pointages_mois.count()
        
        # 4. CALCUL DES MÉTRIQUES GLOBALES
        # Heures totales travaillées par tous les employés
        total_heures = timedelta()
        
        # Compteurs de ponctualité pour tous les pointages
        ponctualite_parfaite = 0
        ponctualite_acceptable = 0
        ponctualite_inacceptable = 0
        
        # Dictionnaire pour suivre les jours de travail par employé
        jours_travailles_par_employe = {}
        
        # Analyse de chaque pointage de TOUS les employés
        for p in pointages_mois:
            if p.duree_travail:
                total_heures += p.duree_travail
            
            # Calculer la ponctualité
            ponctualite = StatisticsService._calculer_ponctualite_pointage(p, p.employe)
            if ponctualite:
                if ponctualite['categorie'] == 'parfait':
                    ponctualite_parfaite += 1
                elif ponctualite['categorie'] == 'acceptable':
                    ponctualite_acceptable += 1
                else:
                    ponctualite_inacceptable += 1
            
            # Compter les jours travaillés par employé
            employe_id = p.employe.cin
            if employe_id not in jours_travailles_par_employe:
                jours_travailles_par_employe[employe_id] = set()
            jours_travailles_par_employe[employe_id].add(p.date_pointage)
        
        # 5. CALCUL DES ABSENCES GLOBALES
        # Nombre total de jours où les employés auraient dû travailler
        jours_total_possibles = employes_actifs * jours_passes_mois
        
        # Nombre total de jours effectivement travaillés
        total_jours_travailles = sum(len(jours) for jours in jours_travailles_par_employe.values())
        
        # Total des absences
        total_absences = max(0, jours_total_possibles - total_pointages)
        
        # 6. CALCUL DES TAUX
        # Taux d'activité global
        taux_activite = (employes_actifs / total_employes * 100) if total_employes > 0 else 0
        
        # Taux de présence et absence
        if jours_total_possibles > 0:
            taux_presence = (total_pointages / jours_total_possibles) * 100
            taux_absence_global = (total_absences / jours_total_possibles) * 100
        else:
            taux_presence = taux_absence_global = 0
        
        # Taux de régularité
        total_ponctualite = ponctualite_parfaite + ponctualite_acceptable + ponctualite_inacceptable
        
        if total_ponctualite > 0:
            taux_regularite_parfaite = (ponctualite_parfaite / total_ponctualite) * 100
            taux_regularite_acceptable = (ponctualite_acceptable / total_ponctualite) * 100
            taux_regularite_inacceptable = (ponctualite_inacceptable / total_ponctualite) * 100
        else:
            taux_regularite_parfaite = taux_regularite_acceptable = taux_regularite_inacceptable = 0
        
        # 7. ANALYSE DES HEURES GLOBALES
        # Heures attendues totales (8h par jour par employé actif)
        heures_attendues_total = timedelta(hours=8 * jours_total_possibles)
        
        # Calcul de l'écart des heures
        total_heures_seconds = total_heures.total_seconds()
        heures_attendues_seconds = heures_attendues_total.total_seconds()
        
        ecart_seconds = total_heures_seconds - heures_attendues_seconds
        ecart_heures = timedelta(seconds=abs(ecart_seconds))
        pourcentage_ecart = (ecart_seconds / heures_attendues_seconds * 100) if heures_attendues_seconds > 0 else 0
        
        # Détermination du statut global des heures
        if total_heures_seconds == 0:
            statut_heures = 'INSUFFISANT'
        elif pourcentage_ecart < -15:  # Moins de 85% des heures attendues
            statut_heures = 'INSUFFISANT'
        elif pourcentage_ecart > 15:   # Plus de 115% des heures attendues
            statut_heures = 'SURPLUS'
        else:                          # Entre 85% et 115%
            statut_heures = 'NORMAL'
        
        # 8. GÉNÉRATION DE L'OBSERVATION
        observation = f"📊 **STATISTIQUES GLOBALES** - Période: {start_of_month.strftime('%B %Y')}\n"
        observation += f"• Jours analysés: {jours_passes_mois} jours\n"
        observation += f"• Employés: {employes_actifs}/{total_employes} actifs ({taux_activite:.1f}%)\n"
        observation += f"• Départements: {departements_actifs_count}/{total_departements} actifs\n"
        observation += f"• Pointages effectués: {total_pointages} sur {jours_total_possibles} attendus ({taux_presence:.1f}%)\n"
        observation += f"• Heures travaillées: {StatisticsService._format_duration_observation(total_heures)}\n"
        observation += f"• Ponctualité: {ponctualite_parfaite} parfaits, {ponctualite_acceptable} acceptables, {ponctualite_inacceptable} inacceptables\n"
        observation += f"• Statut heures: {statut_heures} (écart: {StatisticsService._format_duration_observation(ecart_heures)}, {pourcentage_ecart:.1f}%)"
        
        # 9. CONSTRUCTION DES STATISTIQUES
        stats = {
            'periode': mois,
            'type_periode': 'mensuel',
            'jours_passes_mois': jours_passes_mois,
            
            # Global - Employés
            'total_employes': total_employes,
            'employes_actifs': employes_actifs,
            'taux_activite_global': round(taux_activite, 2),
            
            # Global - Départements
            'total_departements': total_departements,
            'departements_actifs': departements_actifs_count,
            'departements_data': departements_data,  # Ajout des données par département
            
            # Pointage et ponctualité
            'total_pointages': total_pointages,
            'jours_total_possibles': jours_total_possibles,
            'total_jours_travailles': total_jours_travailles,
            'ponctualite_parfaite': ponctualite_parfaite,
            'ponctualite_acceptable': ponctualite_acceptable,
            'ponctualite_inacceptable': ponctualite_inacceptable,
            'heures_travail_total': total_heures,
            'moyenne_heures_quotidiennes': total_heures / total_pointages if total_pointages > 0 else timedelta(),
            
            # Régularité
            'taux_regularite_parfaite': round(taux_regularite_parfaite, 2),
            'taux_regularite_acceptable': round(taux_regularite_acceptable, 2),
            'taux_regularite_inacceptable': round(taux_regularite_inacceptable, 2),
            
            # Présence et absence
            'total_absences': total_absences,
            'taux_presence': round(taux_presence, 2),
            'taux_absence_global': round(taux_absence_global, 2),
            
            # Analyse des heures globales
            'heures_attendues_total': heures_attendues_total,
            'statut_heures_global': statut_heures,
            'ecart_heures_global': ecart_heures,
            'pourcentage_ecart_global': round(pourcentage_ecart, 2),
            'observation_globale': observation
        }
        
        logger.info(f"🌐 Stats globales calculées - "
                   f"Employés: {total_employes}, Actifs: {employes_actifs}, "
                   f"Départements: {total_departements}, Actifs: {departements_actifs_count}, "
                   f"Pointages: {total_pointages}, Ponctualité: {ponctualite_parfaite}/{ponctualite_acceptable}/{ponctualite_inacceptable}")
        return stats
    
    @staticmethod
    def _format_duration_observation(td):
        """Formate une durée pour l'observation"""
        if not td:
            return "0h 00min"
        total_seconds = int(td.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        return f"{hours}h {minutes:02d}min"
    
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
                    'jours_absents': stats_data.get('jours_absents', 0),
                    'moyenne_heures_quotidiennes': stats_data['moyenne_heures_quotidiennes'],
                    
                    # Ponctualité détaillée
                    'ponctualite_parfaite': stats_data.get('ponctualite_parfaite', 0),
                    'ponctualite_acceptable': stats_data.get('ponctualite_acceptable', 0),
                    'ponctualite_inacceptable': stats_data.get('ponctualite_inacceptable', 0),
                    'retard_moyen_minutes': stats_data.get('retard_moyen_minutes', 0),
                    'depart_avance_moyen_minutes': stats_data.get('depart_avance_moyen_minutes', 0),
                    
                    # Régularité
                    'regularite_statut': stats_data.get('regularite_statut', 'acceptable'),
                    'taux_regularite': stats_data.get('taux_regularite', 0),
                    
                    # Présence et absence
                    'taux_presence': stats_data.get('taux_presence', 0),
                    'taux_absence': stats_data.get('taux_absence', 0),
                    
                    # Analyse complémentaire
                    'heures_attendues': stats_data.get('heures_attendues_jours_passes'),
                    'ecart_heures': stats_data.get('ecart_heures'),
                    
                    'jours_total': stats_data.get('jours_total_passes', 0)
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
                'jours_absents': 0,
                'ponctualite_parfaite': 0,
                'ponctualite_acceptable': 0,
                'ponctualite_inacceptable': 0,
                'regularite_statut': 'acceptable',
                'taux_regularite': 0,
                'taux_presence': 0,
                'taux_absence': 0,
                'statut_heures': 'NON_DEFINI',
                'observation_heures': 'Erreur lors du calcul des statistiques'
            }