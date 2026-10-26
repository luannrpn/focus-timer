# Focus Timer

Timer Pomodoro minimalista: anel animado, blocos de foco, pausas curtas e longas configuráveis e estatísticas de foco dos últimos 7 dias.

**Demo:** https://luannrpn.github.io/focus-timer/

## Recursos

- Ciclo configurável: foco, pausa curta, pausa longa e quantidade de focos até a pausa longa (padrão 25 / 5 / 15 / 4).
- Contagem baseada no horário de término, sem acumular erro mesmo com a aba em segundo plano.
- O tempo restante aparece no título da aba. A barra de espaço inicia e pausa.
- Aviso sonoro ao fim de cada fase (Web Audio).
- Estatísticas dos últimos 7 dias. Configurações e histórico ficam no `localStorage`, nada é enviado a servidor.

## Rodar localmente

```bash
npm install
npm run dev
npm test
npm run build
```

## Tecnologias

Vite, TypeScript, GSAP + ScrollTrigger, Lenis e [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) (`@fontsource-variable/instrument-sans`, licença OFL).

## Autoria

Autor: **Luann Neves** ([@luannrpn](https://github.com/luannrpn)). Veja [AUTHORS.md](AUTHORS.md), [LICENSE](LICENSE) (MIT) e [CITATION.cff](CITATION.cff).
