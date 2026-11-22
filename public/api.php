<?php
// Sauvegarde et synchronisation des joueurs. Tout est anonyme : un pseudo, un avatar, la progression.
// Les données sont dans gaby-data/, hors du dossier web (jamais accessibles depuis Internet).
//   gaby-data/joueurs/<empreinte>.json : un fichier par joueur, nommé d'après l'empreinte de son code personnel
//   gaby-data/joueurs/secours/        : une copie par jour et par joueur, gardée 30 jours

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const MAX_JOUEURS = 10; // pas de code d'invitation : c'est cette limite qui protège l'app

$dossier = getenv('GABY_DATA') ?: dirname(__DIR__, 2) . '/gaby-data';
$dossierJoueurs = $dossier . '/joueurs';
$dossierSecours = $dossierJoueurs . '/secours';

function repondre(int $code, array $donnees): never {
    http_response_code($code);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_dir($dossierJoueurs) && !@mkdir($dossierJoueurs, 0700, true)) repondre(503, ['erreur' => 'non-configure']);

// Le code se tape comme on veut : majuscules, minuscules, avec ou sans tiret (TIGRE-781 = tigre781)
$normaliser = fn(string $code): string => preg_replace('/[^A-Z0-9]/', '', strtoupper($code));
$empreinte = fn(string $code): string => substr(hash('sha256', 'gaby:' . $normaliser($code)), 0, 32);
$fichierDe = fn(string $code): string => $dossierJoueurs . '/' . $empreinte($code) . '.json';

function lire(string $fichier): ?array {
    if (!is_file($fichier)) return null;
    $d = json_decode(file_get_contents($fichier), true);
    return is_array($d) ? $d : null;
}
function ecrire(string $fichier, array $d): void {
    $tmp = $fichier . '.tmp';
    file_put_contents($tmp, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    rename($tmp, $fichier);
}

// Deux pseudos sont les mêmes sans compter majuscules, accents, espaces et signes (« Zoé » = « zoe »)
function clePseudo(string $pseudo): string {
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $pseudo);
    return preg_replace('/[^a-z0-9]/', '', strtolower($ascii !== false ? $ascii : $pseudo));
}
/** Le pseudo est-il déjà celui d'un autre joueur ? ($sauf : le fichier du joueur lui-même) */
function pseudoPris(string $dossierJoueurs, string $pseudo, string $sauf = ''): bool {
    $cle = clePseudo($pseudo);
    foreach (glob($dossierJoueurs . '/*.json') as $f) {
        if ($f === $sauf) continue;
        $p = lire($f)['profil']['pseudo'] ?? '';
        if ($p !== '' && clePseudo($p) === $cle) return true;
    }
    return false;
}
$nettoyerPseudo = fn($p): string => mb_substr(trim(strip_tags((string) $p)), 0, 20);

$methode = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// --- Créer un profil : un pseudo libre, et pas plus de MAX_JOUEURS joueurs
if ($methode === 'POST' && $action === 'creer') {
    $recu = json_decode(file_get_contents('php://input'), true) ?? [];
    $pseudo = $nettoyerPseudo($recu['pseudo'] ?? '');
    $avatar = preg_replace('/[^a-z0-9-]/', '', (string) ($recu['avatar'] ?? ''));
    if ($pseudo === '' || clePseudo($pseudo) === '') repondre(400, ['erreur' => 'pseudo']);
    $verrou = fopen($dossier . '/.verrou', 'c');
    flock($verrou, LOCK_EX); // deux créations en même temps ne doivent pas dépasser la limite ni prendre le même pseudo
    if (count(glob($dossierJoueurs . '/*.json')) >= MAX_JOUEURS) repondre(403, ['erreur' => 'complet']);
    if (pseudoPris($dossierJoueurs, $pseudo)) repondre(409, ['erreur' => 'pris']);
    $mots = ['LUNE', 'COMETE', 'VOLCAN', 'ETOILE', 'FUSEE', 'DRAGON', 'TIGRE', 'ORAGE', 'PLANETE', 'REQUIN', 'NUAGE', 'ROCHER'];
    do {
        $code = $mots[array_rand($mots)] . '-' . random_int(100, 999);
    } while (is_file($fichierDe($code)));
    ecrire($fichierDe($code), ['etat' => null, 'profil' => ['pseudo' => $pseudo, 'avatar' => $avatar], 'cree' => date('c')]);
    repondre(200, ['code' => $code]);
}

// --- Toutes les autres actions : avec le code personnel du joueur
$code = trim((string) ($_SERVER['HTTP_X_GABY_CODE'] ?? ''));
$fichier = $code !== '' ? $fichierDe($code) : '';
if ($code === '' || !is_file($fichier)) {
    sleep(1); // freine les essais au hasard
    repondre(401, ['erreur' => 'code']);
}

// Changer de pseudo (depuis les réglages) : seulement s'il n'est pas déjà celui d'un autre joueur
if ($methode === 'POST' && $action === 'pseudo') {
    $recu = json_decode(file_get_contents('php://input'), true) ?? [];
    $pseudo = $nettoyerPseudo($recu['pseudo'] ?? '');
    if ($pseudo === '' || clePseudo($pseudo) === '') repondre(400, ['erreur' => 'pseudo']);
    repondre(200, ['libre' => !pseudoPris($dossierJoueurs, $pseudo, $fichier)]);
}

if ($methode === 'GET') {
    $d = lire($fichier);
    repondre(200, ['etat' => $d['etat'] ?? null, 'profil' => $d['profil'] ?? null]);
}

// Supprimer le profil (demandé par le parent) : le fichier et toutes ses copies de secours, définitivement.
if ($methode === 'POST' && $action === 'supprimer') {
    unlink($fichier);
    foreach (glob($dossierSecours . '/' . $empreinte($code) . '-*.json') as $copie) unlink($copie);
    repondre(200, ['supprime' => true]);
}

// Remise à zéro en mode dev (bouton 🔄) : rien n'est détruit, le profil est mis de côté dans secours/.
if ($methode === 'POST' && $action === 'reset' && getenv('GABY_DEV') === '1') {
    if (!is_dir($dossierSecours)) mkdir($dossierSecours, 0700, true);
    rename($fichier, $dossierSecours . '/' . $empreinte($code) . '-avant-reset-' . date('Y-m-d-His') . '.json');
    repondre(200, ['mis-de-cote' => true]);
}

if ($methode === 'POST') {
    $corps = file_get_contents('php://input');
    if (strlen($corps) > 2_000_000) repondre(413, ['erreur' => 'trop-gros']);
    $recu = json_decode($corps, true);
    if (!is_array($recu) || !isset($recu['etat']) || !is_array($recu['etat'])) repondre(400, ['erreur' => 'format']);

    $verrou = fopen($dossier . '/.verrou', 'c');
    flock($verrou, LOCK_EX);

    $d = lire($fichier) ?? [];
    $actuel = $d['etat'] ?? null;
    $revActuelle = (int) ($actuel['rev'] ?? 0);
    $revBase = (int) ($recu['revBase'] ?? -1);
    if ($actuel !== null && $revBase !== $revActuelle && empty($recu['forcer'])) {
        flock($verrou, LOCK_UN);
        repondre(409, ['erreur' => 'conflit', 'etat' => $actuel]);
    }

    // Une copie de secours par jour et par joueur, gardée 30 jours
    if ($actuel !== null) {
        if (!is_dir($dossierSecours)) mkdir($dossierSecours, 0700, true);
        $copie = $dossierSecours . '/' . $empreinte($code) . '-' . date('Y-m-d') . '.json';
        if (!is_file($copie)) copy($fichier, $copie);
        foreach (glob($dossierSecours . '/*.json') as $vieux) {
            if (filemtime($vieux) < time() - 30 * 86400) unlink($vieux);
        }
    }

    $nouvel = $recu['etat'];
    $nouvel['rev'] = $revActuelle + 1;
    $nouvel['majServeur'] = date('c');
    $d['etat'] = $nouvel;
    if (isset($nouvel['profil'])) $d['profil'] = $nouvel['profil'];
    ecrire($fichier, $d);

    flock($verrou, LOCK_UN);
    repondre(200, ['rev' => $nouvel['rev']]);
}

repondre(405, ['erreur' => 'methode']);
