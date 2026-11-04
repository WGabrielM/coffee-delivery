# Coffee Delivery — Análise do Figma (Fase 1, validada visualmente)

Projeto: capstone do módulo (refazer o Coffee Delivery com IA)
Fontes: `Coffee Delivery • Desafio React (Copy).fig` (arquivo completo), `image-frames.png` (6316×2878, escala 1:1 da seção "Projeto") e `Coffee Delivery • Desafio React (Copy).pdf` (5 páginas vetoriais)
Arquivo Figma: `ulv1uBRpFKh359TWAxTKUk`
Data: 04/11/2026

## 1. Método e confiabilidade

- **MCP do Figma: sem acesso ao arquivo.** O conector está autenticado como "Time Tecnologia" (figma@ideamaker.com.br), não como a conta dona do arquivo; `get_metadata` e `create_session` retornam "sem acesso de edição". Mesmo após reconectar, `whoami` retorna a mesma conta.
- **Fonte 1 — `.fig` decodificado offline** (973 nós): estrutura, auto-layout, tamanhos, raios, bordas, nomes e textos.
- **Fonte 2 — PNG 1:1 e PDF vetorial:** inspeção visual das 4 telas em resolução total, medição de cores nos pixels e dos textos do PDF (tamanhos exatos; cores medidas renderizando cada texto a 4x).
- **Regra adotada: a renderização vence os dados do `.fig`.** A validação mostrou que o `.fig` guarda paints base que não correspondem ao que aparece (ver seção 2). Por isso, todos os valores abaixo marcados como "medido" vêm da renderização; os demais, do `.fig`.
- **Ainda não coberto:** fluxos e interações do protótipo; estados de hover (existem como variantes no `.fig`, mas não aparecem nas telas); comportamento de validação do formulário.
- Altura de linha no arquivo vem como multiplicador (1,3 = 130%; 1,6 = 160%). Cores medidas têm margem de ±1 no valor por suavização de borda; foram mapeadas ao token mais próximo.

## 2. Divergências entre os dados do `.fig` e a renderização

| Elemento | Dado do `.fig` | Renderização (vale este) |
|---|---|---|
| Título do hero | `#251D1B` | `#272221` (Base/Title) — não é um token novo |
| Texto da cidade (navbar) | `#6029D4` | `#4B2995` (Brand/Purple Dark) — igual ao projeto atual |
| Ícone "Entrega rápida e rastreada" | `#C47F17` | `#DBAC2C` (Brand/Yellow) |
| Ícone "Embalagem mantém o café intacto" | `#DBAC2C` | `#574F4D` (Base/Text, cinza escuro) |
| Descrição do café | `#706765` (Base/Info) | `#8D8686` (Base/Label) |
| Filtros (Tradicional, especial…) | frame presente | **oculto** (`visible: false`); não aparece na Home |
| Preço do card | um texto "R$ 9,90" Bold 24 | "R$" pequeno (Roboto Regular 14) + valor Bold 24 |
| Linha "Total" do checkout | 18/16 (vazio) e 20 (preenchido) | 20 px Bold nos dois (rótulo e valor) |
| Ilustração do sucesso | só vetores | entregador numa scooter roxa com planta |

## 3. Estrutura do arquivo

| Página | Conteúdo |
|---|---|
| 🚀 Sobre | Frame 3720×1080 de apresentação do desafio (marca Rocketseat/Ignite; fora do escopo do app) |
| 💻 Projeto | Seção com as 4 telas + link do protótipo interativo |
| 🎨 Style Guide | Cores, tipografia, ícones, imagens e 6 grupos de componentes |
| Internal Only Canvas | Amostras dos estilos (cores e textos) |

Telas (1440 px de largura, fundo `#FAFAFA`): **Home** 1440×2293 · **Checkout** (formulário vazio) 1440×1013 · **Checkout Filled** (formulário preenchido) 1440×1013 · **Success** 1440×1013. O PDF traz as 4 telas nas páginas 2–5.

## 4. Design tokens

### 4.1 Cores do app

| Token | Hex | Uso confirmado na renderização |
|---|---|---|
| Base/White | `#FFFFFF` | Navbar, texto do botão primário e do badge |
| Base/Background | `#FAFAFA` | Fundo das telas |
| Base/Card | `#F3F2F2` | Cards de café e do checkout |
| Base/Input | `#EDEDED` | Fundo dos inputs |
| Base/Button | `#E6E5E5` | Counter, botão "Remover", Select, borda do input |
| Base/Hover | `#D7D5D5` | Hover (variante; não visível nas telas) |
| Base/Label | `#8D8686` | Descrição do café, placeholders, "Opcional" |
| Base/Text | `#574F4D` | Texto corrido, "R$" e valor no card, valores dos inputs, labels dos Selects, subtotais |
| Base/Subtitle | `#403937` | Nome do café, "Nossos cafés", títulos de seção do checkout, subtítulo do hero e do sucesso, "Total" |
| Base/Title | `#272221` | Título do hero, número do counter |
| Brand/Purple Light | `#EBE5F9` | Pill de localização, Select selecionado |
| Brand/Purple | `#8047F8` | Ícones +/− do counter, ícone de pagamento, borda do Select selecionado, ícone do local (sucesso) |
| Brand/Purple Dark | `#4B2995` | Botão do carrinho no card, texto da cidade |
| Brand/Yellow Light | `#F1E9C9` | Botão do carrinho na navbar, fundo das tags |
| Brand/Yellow | `#DBAC2C` | Botão "Confirmar pedido", ícone de tempo (sucesso) |
| Brand/Yellow Dark | `#C47F17` | Texto das tags, ícone do carrinho, badge, pin do endereço, título "Uhu! Pedido confirmado", ícone de pagamento (sucesso) |
| Feedback/Error | `#CC2937` / `#F03847` | Definidos no Figma; não aparecem nas 4 telas |

Outras cores: `#EBC136` (formas decorativas amarelas do hero), `#8B9D36` e demais cores da ilustração do sucesso (vetor). `Base/Info #706765` existe no Figma, mas não foi usada em nenhum texto renderizado. Cores de marca Ignite/Rocketseat, Greyscale e Neutral pertencem à página Sobre e não entram no app. Não há cor fora dos tokens nas telas: o título do hero é `Base/Title`.

### 4.2 Tipografia

Famílias: **Roboto** (corpo) e **Baloo 2** (títulos). Ambas já carregadas no `index.html` atual.

| Estilo | Fonte | Peso | Tamanho | Linha | Caixa |
|---|---|---|---|---|---|
| Title XL | Baloo 2 | ExtraBold | 48 | 1,3 | normal |
| Title L | Baloo 2 | ExtraBold | 32 | 1,3 | normal |
| Title M | Baloo 2 | ExtraBold | 24 | 1,3 | normal |
| Title S | Baloo 2 | Bold | 20 | 1,3 | normal |
| Title XS | Baloo 2 | Bold | 18 | 1,3 | normal |
| Text Regular L / M / S | Roboto | Regular | 20 / 16 / 14 | 1,3 | normal |
| Text Bold L / M / S | Roboto | Bold | 20 / 16 / 12 | 1,3 | normal (S: letter-spacing −6%) |
| Subtitle XL | Roboto | Bold | 24 | 1,3 | normal |
| Button G | Roboto | Bold | 14 | 1,6 | MAIÚSCULAS |
| Button S | Roboto | Regular | 12 | 1,6 | MAIÚSCULAS |
| Tag | Roboto | Bold | 10 | 1,3 | MAIÚSCULAS |
| Tag L | Roboto | Bold | 12 | 1,3 | MAIÚSCULAS |

Tamanhos confirmados no PDF: hero 48; "Nossos cafés" e "Uhu! Pedido confirmado" 32; nome do café 20; subtítulos do hero e do sucesso 20; preço 24 (e "R$" 14); títulos do checkout ("Complete seu pedido", "Cafés selecionados") 18; "Endereço de Entrega"/"Pagamento" 16; descrições e inputs 14; labels do Select 12; badge do carrinho 12; tag 10; linha "Total" 20.

Estilos "Text/Xs, Sm, Md, Lg, Hg" também existem no arquivo, mas não aparecem nas 4 telas.

### 4.3 Espaçamento, raios, bordas

- Margem horizontal da página: **160 px** (conteúdo de 1120 px). Navbar de 104 px, fundo branco.
- Padding simétrico: pill de localização 8 (38 px de altura); botão primário 12 vertical; counter 8 horizontal; tag de card 8×4; inputs 12; Select 16; cards do checkout 40.
- Raios: botões, counter, pill e Select **6**; inputs **4**; tags **100**; ícones circulares **1000**; **card de café 6/36/6/36** (TL/TR/BR/BL); **card resumo do checkout 6/44/6/44**; cards do formulário **6**; **card do pedido (sucesso) 6/36/6/36**.
- Bordas de 1 px: input `#E6E5E5` (ativo/preenchido `#C47F17`); Select selecionado `#8047F8`; divisores `#D7D5D5` (renderizado mais claro, ~`#ECEBEB`); **card do sucesso com borda em gradiente** `#DBAC2C → #8047F8`.
- Sem sombras. O hero tem fundo com manchas amarelas e roxas muito suaves em blur.

## 5. Componentes

| Componente | Variantes | Medidas / notas |
|---|---|---|
| Coffee Card | Catalog, Cart | Catalog 256×310; Cart 368×80 |
| Coffee (imagem) | 14 fotos de café | 120×120 no catálogo, 64×64 no carrinho; a foto sobrepõe a borda superior do card |
| Button | Primary (132×46, no checkout 368×46), Secondary "Remover" (91×32), Icon (38×38, `#4B2995`); Default/Hover | Hover só como variante no `.fig` |
| Counter | Default, Plus, Minus | 72×38 (card) / 72×32 (carrinho); ícones +/− roxos |
| Cart (navbar) | Empty, Full | 38×38; Full mostra badge circular 20×20 (`#C47F17`, número branco) |
| Input | Ativo × Preenchido | 42 de altura; placeholder `Base/Label`; "Opcional" em itálico 12 no Complemento |
| Select (pagamento) | Default, Selected, Hover | 179×51; ícone roxo + label Roboto 12 maiúsculas |
| Tag | Card (10 px, fundo `#F1E9C9`) | texto `#C47F17`; a tag de filtro existe no `.fig`, mas está oculta |
| Ícones | 13 (estilo Phosphor) | shopping-cart-fill, timer-fill, package-fill, coffee-fill, map-pin-fill, map-pin-line, currency-dollar, trash, plus-bold, minus-bold, credit-card, money, bank |

## 6. Telas

### 6.1 Home

- **Navbar:** logo (cálice roxo + "Coffee Delivery") à esquerda; à direita, pill "Porto Alegre, RS" com pin roxo e botão do carrinho (vazio na Home).
- **Intro (544 px):** título "Encontre o café perfeito para qualquer hora do dia" (Title XL, `#272221`) e subtítulo "Com o Coffee Delivery você recebe seu café onde estiver, a qualquer hora" (Roboto 20, `#403937`). Benefícios em grade 2×2, círculos de 32 px:
  - *Compra simples e segura* — carrinho, `#C47F17`
  - *Embalagem mantém o café intacto* — pacote, `#574F4D`
  - *Entrega rápida e rastreada* — timer, `#DBAC2C`
  - *O café chega fresquinho até você* — xícara, `#8047F8`
  À direita, imagem do copo de café com mancha amarela e arco roxo (476×360).
- **Nossos cafés:** título (Title L); **sem filtros visíveis**; grade de **14 cards em 4 colunas** (1120 = 4×256 + 3×32; gap vertical 40), última linha com 2 cards alinhados à esquerda. Cada card: foto circular sobre a borda superior, tags centralizadas, nome (Baloo 2 Bold 20), descrição (14, `#8D8686`, centralizada), linha de compra com "R$" pequeno + valor 24 Bold, counter e botão roxo escuro do carrinho.

### 6.2 Checkout e Checkout Filled

- **Diferença entre as duas telas (confirmada):** *Checkout* tem formulário vazio (placeholders CEP, Rua, Número, Complemento "Opcional", Bairro, Cidade, UF) e nenhum meio de pagamento selecionado; *Checkout Filled* tem o formulário preenchido (90250-440, Rua João Daniel Martinelli, 102, Farrapos, Porto Alegre, RS) e **Cartão de crédito selecionado**. A navbar mostra o carrinho cheio com badge **3** nas duas.
- **Coluna esquerda (640 px, x=160) — "Complete seu pedido":** card *Endereço de Entrega* (ícone de pin `#C47F17`; "Informe o endereço onde deseja receber seu pedido") com CEP (200); Rua (560); Número (200) + Complemento (348); Bairro (200) + Cidade (276) + UF (60), gap 12 entre colunas e 16 entre linhas. Card *Pagamento* (ícone `$` roxo; "O pagamento é feito na entrega. Escolha a forma que deseja pagar") com 3 selects: **Cartão de crédito, Cartão de débito, Dinheiro**.
- **Coluna direita (448 px, x=832) — "Cafés selecionados":** card resumo (raio 6/44/6/44, padding 40) com 2 itens (foto 64, nome, counter, "REMOVER", preço à direita em Roboto Bold 16 `#574F4D`), divisores, **Total de itens R$ 29,70**, **Entrega R$ 3,50**, **Total R$ 33,20** (20 Bold) e botão **CONFIRMAR PEDIDO** (`#DBAC2C`, texto branco, 368×46).
- **Inconsistência do mock:** o Latte aparece com counter "1" e preço R$ 19,80, e o badge mostra 3. Os números só fecham com quantidade 2 para o Latte (9,90 + 19,80 = 29,70; 1 + 2 = 3). Na implementação, usar o cálculo correto (preço × quantidade; badge = soma das quantidades).

### 6.3 Success

- Título "Uhu! Pedido confirmado" (Baloo 2 ExtraBold 32, `#C47F17`) e subtítulo "Agora é só aguardar que logo o café chegará até você" (Roboto 20, `#403937`).
- Card do pedido (526×270, raio 6/36/6/36, borda em gradiente amarelo→roxo) com três linhas, cada uma com ícone circular de 32 px: **local** (roxo `#8047F8`) *Entrega em **Rua João Daniel Martinelli, 102** / Farrapos - Porto Alegre, RS*; **tempo** (amarelo `#DBAC2C`) *Previsão de entrega **20 min - 30 min***; **pagamento** (amarelo escuro `#C47F17`) *Pagamento na entrega **Cartão de Crédito***. Trechos em negrito: endereço e número, faixa de tempo, forma de pagamento.
- Ilustração à direita (492×293): entregador numa scooter roxa com uma planta. O carrinho da navbar volta ao estado vazio (sem badge).

## 7. Conteúdo dos 14 cafés (texto do Figma, tags confirmadas na renderização)

Todos custam R$ 9,90. Ordem da grade:

| # | Nome | Descrição | Tags |
|---|---|---|---|
| 1 | Expresso Tradicional | O tradicional café feito com água quente e grãos moídos | Tradicional |
| 2 | Expresso Americano | Expresso diluído, menos intenso que o tradicional | Tradicional |
| 3 | Expresso Cremoso | Café expresso tradicional com espuma cremosa | Tradicional |
| 4 | Expresso Gelado | Bebida preparada com café expresso e cubos de gelo | Tradicional, Gelado |
| 5 | Café com Leite | Meio a meio de expresso tradicional com leite vaporizado | Tradicional, Com leite |
| 6 | Latte | Uma dose de café expresso com o dobro de leite e espuma cremosa | Tradicional, Com leite |
| 7 | Capuccino | Bebida com canela feita de doses iguais de café, leite e espuma | Tradicional, Com leite |
| 8 | Macchiato | Café expresso misturado com um pouco de leite quente e espuma | Tradicional, Com leite |
| 9 | Mocaccino | Café expresso com calda de chocolate, pouco leite e espuma | Tradicional, Com leite |
| 10 | Chocolate Quente | Bebida feita com chocolate dissolvido no leite quente e café | Especial, Com leite |
| 11 | Cubano | Drink gelado de café expresso com rum, creme de leite e hortelã | Especial, Alcoólico, Gelado |
| 12 | Havaiano | Bebida adocicada preparada com café e leite de coco | Especial |
| 13 | Árabe | Bebida preparada com grãos de café árabe e especiarias | Especial |
| 14 | Irlandês | Bebida a base de café, uísque irlandês, açúcar e chantilly | Especial, Alcoólico |

Os rótulos aparecem em maiúsculas por estilo (Tag, uppercase), não no dado.

## 8. Assets

- 35 imagens no `.fig`: 14 fotos de café (PNG quadrado, 266 a 1332 px), imagem do hero, avatar e imagens da página Sobre.
- Vetores/SVG a extrair: logo, 13 ícones, ilustração do sucesso, formas decorativas do hero.
- O mapeamento imagem → café precisa ser feito pelo hash do preenchimento (passo da fase de assets); a ordem visual da seção 7 serve de conferência.

## 9. Comparação com o projeto atual (`coffee-delivery`)

**Frontend**

- `default.ts`: **os 16 tokens batem** com o Figma. Faltam apenas `error` (opcional) e `yellow-strong #EBC136` para o fundo do hero. `Base/Info` existe no Figma sem uso renderizado.
- Tipografia: sem tokens; Baloo 2 não é usado em nenhum lugar; `global.ts` define `box-sizing: 0` (inválido).
- `Header`: a cor do texto da cidade (`purple-dark`) **está certa**. Desvios: pill com padding 16 e raio 8 (spec: 8 e 6), bloco de ações com largura fixa de 16rem (spec: gap 12), margem de 2rem em vez de navbar de 104 px, logo e ícones por caminhos `/src/assets/...` que quebram no build.
- Falta todo o resto: Home (hero, grade), Checkout, Success, rotas, estado do carrinho, integração com a API e os componentes Button, Counter, Input, Select, Tag e CoffeeCard.

**Backend**

- `Coffee`: nome, descrição e tags em inglês no seed (Figma em português); nomes divergem ("Americano"/"Expresso Americano", "Mochaccino"/"Mocaccino", "Iced Espresso"/"Expresso Gelado"). Tags do seed: `traditional, special, with milk, alcoholic, iced`.
- `Address` cobre os 7 campos do formulário.
- `Order` **não tem forma de pagamento** (crédito, débito, dinheiro) **nem taxa de entrega**; o sucesso exibe forma de pagamento e previsão de entrega (20–30 min).
- Só existe `GET /coffees`; faltam carrinho/pedido, DTOs com validação, CORS, tratamento de erros e testes.

## 10. Decisões e pendências

Decididas em 04/11/2026:

1. **Repositório:** o atual, recomeçando do zero (código antigo preservado na tag local `legacy-before-rebuild`, commit `e09d1d7`).
2. **Idioma:** UI, dados, código e API em inglês (os textos em português deste documento são a referência do Figma e serão traduzidos).
3. **Taxa de entrega:** fixa em R$ 3,50.
4. **Filtros por tag:** entram, mesmo estando ocultos no Figma; o comportamento será definido no plano (ver `docs/PLAN.md`).
5. **Carrinho:** decisão técnica registrada no plano.

Pendentes:

1. **Acesso ao Figma por MCP:** ainda sem acesso; o PNG e o PDF cobrem a análise visual e o `.fig` offline serve como fonte de assets.
2. **Protótipo:** fluxos e validações do formulário não foram decodificados; confirmar no link do protótipo.
3. **Projeto-molde do professor:** ainda não informado.
