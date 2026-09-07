<?php
/**
 * send-form.php — Ajánlatkérő űrlap feldolgozása (A-Leco Management Kft.)
 *
 * - Csak POST kérést fogad el
 * - Szerveroldali validáció (kötelező mezők, e-mail formátum, adatkezelés checkbox)
 * - Honeypot + időzítés alapú egyszerű botvédelem
 * - Header injection elleni védelem (minden fejlécbe kerülő értékből eltávolítjuk a sortöréseket)
 * - AJAX (fetch) hívásnál JSON választ ad, hagyományos form-beküldésnél átirányít
 */

declare(strict_types=1);

mb_internal_encoding('UTF-8');

const RECIPIENT_EMAIL = 'sevenautoszer@gmail.com';
const SITE_NAME       = 'A-Leco Management Kft. — patkanyirtasbudapest.hu';
// A From fejléc a saját domainre mutat, hogy a legtöbb levelezőszerver elfogadja.
// Élesítés után érdemes SPF/DKIM rekordot beállítani ehhez a domainhez.
const FROM_ADDRESS    = 'webform@patkanyirtasbudapest.hu';
const MIN_SECONDS_TO_SUBMIT = 3; // ennél gyorsabb kitöltés valószínűleg bot

function is_ajax_request(): bool
{
    return isset($_SERVER['HTTP_X_REQUESTED_WITH'])
        && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

function respond_error(string $message, int $statusCode = 400): void
{
    http_response_code($statusCode);

    if (is_ajax_request()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }

    header('Content-Type: text/html; charset=UTF-8');
    ?>
    <!DOCTYPE html>
    <html lang="hu">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hiba az űrlap küldésekor | A-Leco Management Kft.</title>
      <meta name="robots" content="noindex">
      <link rel="stylesheet" href="/css/style.css">
    </head>
    <body>
      <main class="state-page">
        <div class="state-page__inner">
          <p class="state-page__kicker">Hiba történt</p>
          <h1>Az űrlapot nem sikerült elküldeni</h1>
          <p><?php echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></p>
          <div class="state-page__actions">
            <a class="btn btn--accent btn--lg" href="/index.html#ajanlat">Vissza az űrlaphoz</a>
            <a class="btn btn--outline-light btn--lg" href="tel:+36203483026">Hívom most</a>
          </div>
        </div>
      </main>
    </body>
    </html>
    <?php
    exit;
}

function respond_success(): void
{
    if (is_ajax_request()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    header('Location: /koszonjuk.html', true, 303);
    exit;
}

// Csak POST engedélyezett.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond_error('Ez a végpont csak űrlap-beküldést fogad. Kérjük, a weboldalon található űrlapot használja.', 405);
}

// Header injection elleni védelem: minden fejlécbe / tárgyba kerülő szövegből
// eltávolítjuk a sortörés-karaktereket.
function clean_header_value(string $value): string
{
    return trim(str_replace(["\r", "\n", "%0a", "%0d", "%0A", "%0D"], '', $value));
}

function post(string $key): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    return trim($value);
}

// --- Honeypot: ha ki van töltve, botnak tekintjük. Nem árulkodunk erről —
// a felhasználó felé sikert mutatunk, de levelet nem küldünk.
$honeypot = post('website');
if ($honeypot !== '') {
    respond_success();
}

// --- Időzítés alapú egyszerű botvédelem.
$loadedAt = post('form_loaded_at');
if ($loadedAt !== '' && ctype_digit($loadedAt)) {
    $elapsedMs = (int) (microtime(true) * 1000) - (int) $loadedAt;
    if ($elapsedMs >= 0 && $elapsedMs < MIN_SECONDS_TO_SUBMIT * 1000) {
        respond_success();
    }
}

// --- Mezők beolvasása és validálása.
$nev        = post('nev');
$telefon    = post('telefon');
$email      = post('email');
$telepules  = post('telepules');
$szolgaltatas = post('szolgaltatas');
$uzenet     = post('uzenet');
$adatkezeles = post('adatkezeles');

$errors = [];

if ($nev === '' || mb_strlen($nev) < 2) {
    $errors[] = 'Adja meg a nevét.';
}

$telefonDigits = preg_replace('/[^0-9+]/', '', $telefon);
if ($telefon === '' || mb_strlen($telefonDigits) < 6) {
    $errors[] = 'Adjon meg egy érvényes telefonszámot.';
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Az e-mail cím formátuma nem érvényes.';
}

if ($telepules === '') {
    $errors[] = 'Adja meg a település vagy kerület nevét.';
}

if ($adatkezeles !== 'on' && $adatkezeles !== '1') {
    $errors[] = 'Az adatkezelési tájékoztató elfogadása kötelező.';
}

if (!empty($errors)) {
    respond_error(implode(' ', $errors));
}

$szolgaltatasLabels = [
    'patkanyirtas'      => 'Patkányirtás',
    'egerirtas'         => 'Egérirtás',
    'sos'               => 'SOS patkányirtás',
    'kutyas_gorenyes'   => 'Kutyás / görényes',
    'tarsashaz_uzleti'  => 'Társasház / üzleti',
    'egyeb'             => 'Egyéb',
];
$szolgaltatasLabel = $szolgaltatasLabels[$szolgaltatas] ?? 'Nincs megadva';

// --- Levél összeállítása.
$subject = clean_header_value('Ajánlatkérés (' . $szolgaltatasLabel . ') — ' . $nev);

$bodyLines = [
    'Új ajánlatkérés érkezett a patkanyirtasbudapest.hu weboldalról.',
    '',
    'Név: ' . $nev,
    'Telefonszám: ' . $telefon,
    'E-mail: ' . ($email !== '' ? $email : 'nincs megadva'),
    'Település / kerület: ' . $telepules,
    'Szolgáltatás típusa: ' . $szolgaltatasLabel,
    '',
    'Üzenet:',
    ($uzenet !== '' ? $uzenet : '(nincs üzenet)'),
    '',
    '---',
    'Beküldés ideje: ' . date('Y-m-d H:i:s'),
    'IP cím: ' . clean_header_value($_SERVER['REMOTE_ADDR'] ?? 'ismeretlen'),
];
$body = implode("\n", $bodyLines);

$headers = [];
$headers[] = 'From: ' . SITE_NAME . ' <' . FROM_ADDRESS . '>';
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $safeName = str_replace('"', '', clean_header_value($nev));
    $headers[] = 'Reply-To: "' . $safeName . '" <' . clean_header_value($email) . '>';
}
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'Content-Transfer-Encoding: 8bit';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$mailSent = @mail(RECIPIENT_EMAIL, $encodedSubject, $body, implode("\r\n", $headers));

if (!$mailSent) {
    respond_error('Technikai hiba miatt nem sikerült elküldeni az üzenetet. Kérjük, hívjon minket telefonon.', 500);
}

respond_success();
