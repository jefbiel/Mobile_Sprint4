# NewCare

NewCare é um aplicativo mobile desenvolvido como projeto acadêmico para apoiar a criação e o acompanhamento de hábitos saudáveis. A proposta do app é transformar pequenas ações do dia a dia em missões, usando elementos de gamificação como XP, níveis, moedas, conquistas e sequência de dias para incentivar o usuário a manter uma rotina melhor.

O aplicativo trabalha com quatro áreas principais de cuidado:

- Saúde mental
- Saúde física
- Lazer
- Sono

Após o login, o usuário passa por um onboarding simples, informa sua área de foco, tempo disponível por dia e nível atual. Com essas informações, o app gera missões personalizadas e acompanha o progresso ao longo do uso.

## Integrantes do Grupo

- Gilson Dias Ramos Junior - RM552345
- Jeferson Gabriel de Mendonça - RM553149
- Larissa Estella Gonçalves dos Santos - RM552695

---

## Como Rodar o Projeto com Expo

1. **Pré-requisitos:**
   - Ter o Node.js instalado, de preferência na versão LTS.
   - Ter o npm instalado. Ele normalmente já vem junto com o Node.js.
   - Ter o Git instalado.
   - Para testar no celular, instalar o aplicativo Expo Go.
   - Para testar em emulador Android, ter o Android Studio configurado.
   - Para testar no simulador iOS, é necessário usar macOS com Xcode instalado.

2. **Clone o repositório:**

   ```bash
   git clone https://github.com/jefbiel/Mobile_Sprint4.git
   cd Mobile_Sprint4/newcare
   ```

3. **Instale as dependências do projeto:**

   ```bash
   npm install
   ```

4. **Inicie o projeto com Expo:**

   ```bash
   npx expo start -c
   ```

5. **Escolha onde executar o app:**
   - Pressione `a` no terminal para abrir no emulador Android.
   - Pressione `i` no terminal para abrir no simulador iOS.
   - Pressione `w` no terminal para abrir a versão web.
   - Escaneie o QR Code com o app Expo Go para abrir no celular.

Também é possível usar os scripts do projeto:

```bash
npm run android
npm run ios
npm run web
```

Observação: os comandos acima devem ser executados dentro da pasta `newcare`.

---

## Funcionalidades

- Login com validação de e-mail e senha.
- Sessão local persistida com AsyncStorage.
- Onboarding com foco, tempo diário disponível e nível atual.
- Geração de missões personalizadas.
- Missões pendentes, concluídas e adicionadas pelo usuário.
- Liberação de novas missões quando metade das missões atuais foi concluída.
- XP, níveis, moedas, streak e dia perfeito.
- Conquistas desbloqueáveis.
- Perfil editável com avatar, nome, área dominante, preferências e meta diária.
- Barra de progresso da meta diária no perfil.
- Feedback visual para erros, loading, conclusão de missão e criação de missão.
- Tela de carregamento inicial enquanto os dados locais são restaurados.
- Calculadora de água na aba Início, com recomendação em litros baseada no peso e na temperatura.
- Medidor de consumo com seleção de copo/garrafa padrão, de 250 ml até 2 L.
- Comunicação em tempo real com Socket.IO entre app e servidor local.
- Integração IoT simulada por tópicos de sensor, com temperatura, umidade e status exibidos automaticamente na interface.
- Uso de geolocalização nativa via Expo Location, com solicitação de permissão e tratamento de recusa.

## Persistência Local

O app usa `@react-native-async-storage/async-storage` em `src/services/storage.ts` para salvar dados relevantes do usuário no próprio dispositivo. O contexto principal (`src/context/AppContext.tsx`) restaura esses dados na inicialização do app e mantém uma tela de carregamento enquanto a sessão, as missões e os dados de hidratação são recuperados.

Dados persistidos:

- Sessão e perfil do usuário: chave `user`.
- Missões personalizadas e progresso: chave `missoes`.
- Meta, medida padrão e consumo diário de água: chave `hidratacao`.

Como validar:

1. Rode o app com Expo.
2. Faça login ou cadastro.
3. Conclua uma missão, altere uma preferência ou registre consumo de água.
4. Feche o app completamente e abra novamente.
5. Confira se a sessão continua ativa e se o progresso salvo permanece na interface.

## Sprint 4: Tempo real, nativo e IoT

A Sprint 4 adiciona uma área de hidratação inteligente na aba Início. O app recebe leituras IoT de temperatura em tempo real, calcula a quantidade recomendada de água e permite registrar a localização do usuário com permissão nativa.

Logo abaixo da calculadora há um medidor diário de água. O usuário escolhe a medida padrão entre copos de 250 ml, 300 ml, 500 ml, 750 ml, garrafas de 1 L, 1,5 L e 2 L. Essa medida passa a ser usada no botão de registro de consumo, mostra quantos copos/garrafas faltam para bater a meta e salva o progresso do dia.

### Comunicação em tempo real

- Protocolo usado: Socket.IO.
- Funções principais no app:
  - `conectarSocketIo`: abre a conexão na tela de Hidratação, recebe `iot:leitura` e `agua:resultado`, e atualiza a UI.
  - `publicarCalculoAguaIo`: emite `agua:calcular` para o servidor.
  - `publicarConsumoAguaIo`: emite `agua:consumo` após o usuário registrar água.
- Eventos implementados:
  - `iot:leitura`: servidor envia leituras de sensores para o app.
  - `agua:calcular`: app envia peso e temperatura.
  - `agua:resultado`: servidor responde a recomendação em ml/litros.
  - `agua:consumo`: app informa a medida registrada, o total consumido e se a meta foi batida.
  - `agua:erro`: servidor informa payload inválido.

### Funcionalidade nativa

- API nativa usada: geolocalização com `expo-location`.
- Permissões configuradas:
  - Android: `ACCESS_COARSE_LOCATION` e `ACCESS_FINE_LOCATION`.
  - iOS: `NSLocationWhenInUseUsageDescription`.
- A tela de Hidratação solicita a permissão em runtime com `requestForegroundPermissionsAsync`.
- Se o usuário recusar a permissão, a tela exibe o estado de recusa e mantém o cálculo funcionando com temperatura manual ou sensor IoT.

### Integração IoT

O servidor local simula um dispositivo IoT, inspirado nos boilerplates das aulas de WebSocket/MQTT. Ele publica, a cada 5 segundos, tópicos como:

```txt
sensor/casa/temperatura
sensor/casa/umidade
sensor/status/conexao
```

Também existe o endpoint HTTP:

```bash
POST http://localhost:3000/api/publicar
```

Body:

```json
{
  "topico": "sensor/casa/temperatura",
  "valor": "29.5"
}
```

Ao publicar uma leitura, o servidor também emite `iot:leitura` via Socket.IO para atualizar a interface automaticamente.

Quando o usuário registra água no app, o servidor recebe `agua:consumo` e publica leituras nos tópicos:

```txt
sensor/hidratacao/consumo
sensor/hidratacao/meta
```

Ao bater a meta diária de água, o app concede 25 XP e 5 moedas uma única vez no dia.

### Como validar tempo real, nativo e IoT

1. Rode `npm run realtime` dentro da pasta `newcare`.
2. Abra o app com `npx expo start -c`.
3. Entre no app e abra a tela de Hidratação.
4. Confira o status `tempo real`, temperatura, umidade e horário de atualização.
5. Use `POST /api/publicar` para enviar uma nova temperatura e veja a interface mudar automaticamente.
6. Toque em `Usar localização` e aceite ou recuse a permissão para validar os dois estados.
7. Calcule a meta de água e registre consumo para emitir `agua:calcular` e `agua:consumo`.

### Como rodar a Sprint 4

Em um terminal, rode o servidor em tempo real:

```bash
cd newcare
npm run realtime
```

Em outro terminal, rode o app:

```bash
cd newcare
npx expo start -c
```

Se estiver testando no celular físico, o app tenta descobrir o IP do computador pelo host do Expo. Se precisar configurar manualmente, defina a URL do servidor:

```bash
EXPO_PUBLIC_REALTIME_URL=http://SEU_IP_LOCAL:3000 npx expo start -c
```

Não há credenciais expostas no código. A URL de tempo real pode ser configurada por variável de ambiente.

### Vídeo demonstrativo

Videodemonstração do app: https://youtu.be/qL4n6zWo8Os

Roteiro sugerido para o vídeo:

1. Abrir o servidor com `npm run realtime` e mostrar os sensores publicando no terminal.
2. Abrir o app no Expo e entrar na aba Início.
3. Mostrar temperatura, umidade e status atualizando automaticamente.
4. Calcular a quantidade de água com Socket.IO online.
5. Tocar em "Usar localização" e demonstrar permissão concedida ou recusada.
6. Publicar uma leitura manual com `POST /api/publicar` e mostrar a UI atualizando.

## Estrutura

```txt
src/
  components/
    Botao.tsx
    CardMissao.tsx
  context/
    AppContext.tsx
  data/
    missoes.ts
  routes/
    AppNavigator.tsx
    types.ts
  screens/
    LoginScreen.tsx
    OnboardingScreen.tsx
    HomeScreen.tsx
    HabitosScreen.tsx
    ProgressoScreen.tsx
    PerfilScreen.tsx
  services/
    realtime.ts
    storage.ts
  types/
    realtime.ts
    index.ts
server/
  realtime.ts
```

## Tecnologias

- Expo
- React Native
- TypeScript
- React Navigation
- AsyncStorage
- Expo SecureStore
- Socket.IO
- Expo Location
- Express para o servidor local de tempo real/IoT
- ESLint

## Login de teste

O app valida o login contra as credenciais criadas no próprio fluxo de cadastro. Se o e-mail digitado não bater com o e-mail salvo, ele orienta a criar cadastro.

Quando um novo cadastro é finalizado, o e-mail e a senha desse cadastro passam a ser as credenciais salvas com Expo SecureStore para os próximos logins. Não há e-mail ou senha padrão expostos no código.

## Scripts úteis

Validar TypeScript:

```bash
./node_modules/.bin/tsc --noEmit
```

Rodar lint:

```bash
npm run lint
```

Rodar servidor Socket.IO/IoT:

```bash
npm run realtime
```

Verificar compatibilidade Expo:

```bash
npx expo install --check
```
