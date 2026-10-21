# Stand Kit (criterion 08 — The Stand Design)

A good stand does three things in five seconds: **says what it is, shows it working, invites people
to try.** Everything here supports that.

## 1. What is in this folder

| File | Use |
|---|---|
| `docs/stand/poster.html` | Editable source of the A3 poster (open in Chrome) |
| `docs/stand/poster-A3.pdf` | Print-ready A3 poster (portrait) with QR code to the live site |

The poster uses the same colours and typeface as the website (SDG 7 green `#2F9E44`, blue
`#1971C2`, yellow `#F5C518`; Poppins), so the stand and the product look like one thing.

## 2. Printing

1. Print `poster-A3.pdf` at **A3, 100 % scale, no margins**. For a bigger poster, print the PDF at
   A2 (it scales cleanly; the QR code is vector).
2. From `poster.html` instead: Chrome → Print → paper **A3**, margins **None**, **Background graphics ON**.
3. Test the QR code with two different phones from 1.5 m away **before** printing many copies.
4. If the website address ever changes, regenerate the QR code: `npx qrcode -t svg "<new url>"`
   and paste the SVG into `poster.html`.

## 3. Layout of the table

```
┌─────────────────────────────────────────────────────────────┐
│                  POSTER (A3/A2, at eye height)               │
│        Energize the Future · QR code · "Try it" list         │
└─────────────────────────────────────────────────────────────┘
   ┌──────────────┐      ┌──────────┐      ┌────────────────┐
   │  LAPTOP      │      │  QR card │      │ TABLET / PHONE │
   │  live demo + │      │ "Scan &  │      │ visitors play  │
   │  leaderboard │      │  play"   │      │ Energy Hero    │
   └──────────────┘      └──────────┘      └────────────────┘
        Presenter stands beside the table, not behind it
```

- **Laptop (presenter):** the *Mini Game* start screen — it shows the **leaderboard**, so there is always
  something moving on the screen. Language set to the visitor's language.
- **Tablet or phone (visitors):** logged on the game, ready to *Start*. Visitors play without help.
- **QR card:** a small printed copy of the QR code on the table edge for people who want it on
  their own phone.
- **Colour & light:** a plain white or light-green tablecloth; avoid clutter — poster, devices,
  QR card, one small plant if you like (it fits the theme).

## 4. The 10-second pitch

> "Can you save a city from pollution on a tight budget? Try Energy Hero — it takes two
> minutes. Beat 2,000 points and you're on our leaderboard."

Then, depending on the visitor:

- **Student:** hand over the tablet → game.
- **Teacher / parent:** show the calculator → "enter your fridge, see what it costs and how many
  trees its CO₂ needs."
- **Jury:** the 3-minute demo route in [PRESENTATION.md](PRESENTATION.md#3-live-demo-route-3-minutes).

## 5. Engagement ideas (optional)

- **Top-score challenge:** keep the best name of the day on the poster with a marker; small
  reward (a sticker).
- **"Fridge test":** ask a visitor for their fridge's wattage and show their yearly cost.
- **Language game:** let visitors switch to a language they know.

## 6. Setup checklist (arrive 30 minutes early)

- [ ] Poster hung, QR checked with a phone
- [ ] Laptop and tablet charged, chargers and a power strip packed
- [ ] **Wake the server:** open `https://energize-the-future-wuln.onrender.com/api/health` (first request can take ~50 s)
- [ ] Both devices connected to reliable internet (own hotspot as backup)
- [ ] Site loaded and a test score submitted (then it appears on the leaderboard)
- [ ] **Offline backup:** project running locally on the laptop (`npm run dev` in `server/` and `client/`)
      and a 60-second screen recording on the desktop
- [ ] Printed copies: QR card, optionally the README's first page
- [ ] Notifications off, volume off, battery saver off, screen timeout long

## 7. Accessibility at the stand

- Large text on the poster (all body text ≥ 11 pt at A3), strong contrast.
- Offer the language switch to every visitor — three languages are a feature, show them.
- Keep the tablet at a comfortable height; allow touch and keyboard use.
