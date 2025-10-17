import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const generateAbsencesPDF = (absences, stats, searchTerm, justificationFilter, monthFilter) => {
  return new Promise((resolve, reject) => {
    try {
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Titre principal
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('RAPPORT DES ABSENCES', 105, 20, { align: 'center' });
      
      // Date de génération
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 105, 30, { align: 'center' });
      
      // Informations sur les filtres
      let filtersInfo = 'Filtres appliqués : ';
      const filters = [];
      
      if (searchTerm) {
        filters.push(`Recherche: "${searchTerm}"`);
      }
      
      if (justificationFilter !== 'all') {
        filters.push(justificationFilter === 'justified' ? 'Justifiées uniquement' : 'Non justifiées uniquement');
      }
      
      if (monthFilter !== 'all') {
        const monthName = format(new Date(2025, parseInt(monthFilter) - 1, 1), 'MMMM', { locale: fr });
        filters.push(`Mois: ${monthName}`);
      }
      
      if (filters.length === 0) {
        filtersInfo += 'Aucun filtre';
      } else {
        filtersInfo += filters.join(', ');
      }
      
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(filtersInfo, 14, 45);
      
      // Statistiques
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('STATISTIQUES', 14, 60);
      
      doc.setFontSize(10);
      doc.text(`Total des absences: ${stats.total}`, 14, 70);
      doc.setTextColor(0, 128, 0);
      doc.text(`Absences justifiées: ${stats.justifiees}`, 14, 78);
      doc.setTextColor(255, 0, 0);
      doc.text(`Absences non justifiées: ${stats.nonJustifiees}`, 14, 86);
      doc.setTextColor(40, 40, 40);
      
      // Préparer les données pour le tableau
      const tableData = absences.map(absence => [
        absence.id_absence || 'N/A',
        absence.employe_nom || 'Inconnu',
        absence.employe_matricule || 'N/A',
        format(parseISO(absence.date_debut_absence), 'dd/MM/yyyy', { locale: fr }),
        format(parseISO(absence.date_fin_absence), 'dd/MM/yyyy', { locale: fr }),
        absence.nbr_jours || 'N/A',
        absence.motif || 'Non spécifié',
        absence.justifiee ? 'Oui' : 'Non'
      ]);
      
      // En-têtes du tableau
      const headers = [
        'ID Absence',
        'Employé',
        'Matricule',
        'Date Début',
        'Date Fin',
        'Jours',
        'Motif',
        'Justifiée'
      ];
      
      // Ajouter le tableau
      doc.autoTable({
        startY: 100,
        head: [headers],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 15 },
          6: { cellWidth: 40 },
          7: { cellWidth: 20 }
        },
        margin: { top: 100 }
      });
      
      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} sur ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
      }
      
      // Sauvegarder le PDF
      const fileName = `absences_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
      doc.save(fileName);
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};