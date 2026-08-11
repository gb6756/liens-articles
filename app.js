// Variables globales
let allLinks= [];
let filteredLinks = [];
// --- VARIABLES POUR LA PAGINATION ---
let currentPage = 1;
const itemsPerPage = 24; // Ex: 24 livres par page (divisible par 4 colonnes = 6 lignes)
// Utilitaire pour récupérer une valeur CSV sans se soucier des majuscules/accents
// Nettoyage HTML pour éviter les failles
   function getVal(row, possibleKeys) {
        if (!row) return '';
        const keys = Object.keys(row);
        for (let pk of possibleKeys) {
            const found = keys.find(k => k.trim().toLowerCase() === pk.toLowerCase());
            if (found && row[found] !== undefined && row[found] !== null) return row[found].toString().trim();
        }
        return '';
    }
function escapeHtml(str) {
   if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Affichage du tableau et du compteur
// Affichage sous forme de cartes (pavés)
  function applyFilters() {
        const l = document.getElementById('fLieu').value.toLowerCase();
        const s = document.getElementById('fSujet').value.toLowerCase();
        const r = document.getElementById('fReference').value.toLowerCase();
		const si = document.getElementById('fSite').value.toLowerCase();

        filteredLinks = allLinks.filter(b => {
            const lieu = getVal(b, ['Lieu']).toLowerCase();
            const sujet = getVal(b, ['Sujet']).toLowerCase();
            const reference = getVal(b, ['Référence']).toLowerCase();
			const site = getVal(b, ['Site']).toLowerCase();
			const lien = getVal(b, ['Lien']);
			

            return (!l || lieu.includes(l)) &&
                   (!s || sujet.includes(s)) &&
                   (!r || reference.includes(r)) &&
				   (!si || site.includes(si)) &&
				   lien;
        });
        render();
    }
// Affichage sous forme de cartes (pavés)
function render() {
    const grid = document.getElementById('linksGrid');
	const countElement = document.getElementById('linkCount');

    if (!grid) return;
	  if (countElement) {
        if (allLinks.length === 0) {
            countElement.textContent = "Aucun lien dans le catalogue.";
        } else if (filteredLinks.length === allLinks.length) {
            countElement.innerHTML = `Total : <span class="results-count-badge">${allLinks.length}</span> liens`;
        } else {
            countElement.innerHTML = `Trouvé(s) : <span class="results-count-badge">${filteredLinks.length}</span> sur ${allLinks.length} liens`;
        }
    }
    // Si aucun livre trouvé
    if (filteredLinks.length === 0) {
        grid.innerHTML = '<div class="no-results">Aucun lien ne correspond à votre recherche.</div>';
        return;
    }
// 3. Découpage des résultats pour la page actuelle
    const totalPages = Math.ceil(filteredLinks.length / itemsPerPage);
    // Si la page actuelle dépasse le total suite à un filtrage, on revient à la page 1
    if (currentPage > totalPages) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const linksToDisplay = filteredLinks.slice(startIndex, endIndex);
	
    // Génération des cartes
    grid.innerHTML = linksToDisplay.map((b, i) => {
		// Indice réel du livre dans le tableau filteredBooks
		const realIndex = startIndex + i;
		
        const lieu = escapeHtml(getVal(b, ['Lieu']) || '-');
        const sujet = escapeHtml(getVal(b, ['Sujet']) || '-');
        const ref = escapeHtml(getVal(b, ['Référence']) || '-');
        const site = escapeHtml(getVal(b, ['Site']) || '-');
        const lien = escapeHtml(getVal(b, ['Lien']) || '');

        return `
			<a href="${getVal(b,['Lien'])}"target="_blank" rel="noopener noreferrer">
            <div class="link-card">
				<div class="lieu-card">${lieu}</div>
				<div class="sujet-card">${sujet}</div>
				<div class="ref-card">Réf : ${ref}</div>
				<div class="site-card">Site : ${site}</div>
            </div>
			</a>
        `;
    }).join('');
	// 5. Génération des boutons de pagination
    renderPagination(totalPages);
}
// Fonction qui génère les boutons 1, 2, 3...
function renderPagination(totalPages) {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement || totalPages <= 1) {
        if (paginationElement) paginationElement.innerHTML = '';
        return;
    }

    let buttonsHtml = `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">❮ Précédent</button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        // Affiche la page si elle est proche de la page courante
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            buttonsHtml += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            buttonsHtml += `<span class="page-dots">...</span>`;
        }
    }

    buttonsHtml += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Suivant ❯</button>
    `;

    paginationElement.innerHTML = buttonsHtml;
}

// Changement de page
function changePage(newPage) {
    currentPage = newPage;
    render();
    // Remonte doucement en haut de la grille pour le confort
    document.getElementById('linkGrid').scrollIntoView({ behavior: 'smooth' });
}
// Fonction utilitaire pour retirer tous les accents et mettre en minuscules
function cleanString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Supprime tous les diacritiques (accents)
}
// --- INITIALISATION AU CHARGEMENT DE LA PAGE ---
window.addEventListener('DOMContentLoaded', function() {
    const statusEl = document.getElementById('status');

    if (statusEl) {
        statusEl.style.color = '#475569';
        statusEl.textContent = "Chargement du catalogue...";
    }

    fetch('liens-articles.csv')
        .then(response => {
            if (!response.ok) {
                throw new throw new Error("Fichier introuvable");
            }
            return response.text();
        })
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
				delimiter: "@",
                skipEmptyLines: true,
                complete: function(res) {
                    if (res.data && res.data.length > 0) {
                        allLinks = res.data;
                        filteredLinks = [...allLinks]; // Au départ, tous les liens sont affichés

                        if (statusEl) {
                            statusEl.style.color = '#16a34a';
                            statusEl.textContent = `✅ ${allLinks.length} liens disponibles`;
                        }

                        // Écouteurs d'événements sur les champs de filtrage
                        applyFilters();
                    } else {
                        if (statusEl) {
                            statusEl.style.color = '#dc2626';
                            statusEl.textContent = "❌ Le fichier CSV semble vide.";
                        }
                    }
                }
            });
        })
        .catch(err => {
            console.error("Erreur de chargement :", err);
            if (statusEl) {
                statusEl.style.color = '#dc2626';
                statusEl.textContent = `❌ Impossible de charger le catalogue : ${err.message}`;
            }
        });
});
