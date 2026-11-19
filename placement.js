/* FTC Quest — questionário de experiência + mini prova de nivelamento.
   Em cada pergunta da prova, o PRIMEIRO item de "o" é a resposta certa (o app embaralha na hora). */

const SELF = [
  { q: "Há quanto tempo você participa de robótica ou FTC?",
    o: [["Nunca participei", 0], ["Menos de 1 temporada", .33], ["1 a 2 temporadas", .66], ["3 temporadas ou mais", 1]] },
  { q: "Como você se sente programando em Java?",
    o: [["Nunca programei", 0], ["Sei o básico: variáveis e if", .33], ["Crio métodos e classes", .66], ["Organizo tudo em subsistemas", 1]] },
  { q: "O que você já fez em um robô FTC?",
    o: [["Nada ainda", 0], ["TeleOp simples com motores", .33], ["Autônomo com encoders e sensores", .66], ["Autônomo com Pedro Pathing ou visão", 1]] }
];

const PL = {
  // Básico
  e: [
    { q: "Qual tipo Java guarda um número com casas decimais, como a potência de um motor?",
      o: ["double", "int", "boolean", "String"],
      e: "double guarda números decimais. int guarda só inteiros." },
    { q: "O que o código dentro de while (opModeIsActive()) faz?",
      o: ["Repete enquanto o OpMode estiver ativo", "Roda uma única vez no INIT", "Só roda depois do STOP", "Cria um novo OpMode"],
      e: "O loop principal continua até alguém apertar STOP." },
    { q: "Qual anotação coloca o programa na lista de TeleOp do Driver Hub?",
      o: ["@TeleOp", "@Autonomous", "@Override", "@Disabled"],
      e: "@TeleOp é o período controlado pelos pilotos; @Autonomous é o autônomo." },
    { q: "Qual operador compara se dois números são iguais?",
      o: ["==", "=", "=>", "!!"],
      e: "= atribui um valor; == compara." },
    { q: "Para que serve hardwareMap.get(DcMotor.class, \"esq\")?",
      o: ["Pegar o motor configurado com o nome \"esq\"", "Criar um motor novo na fiação", "Apagar a configuração do robô", "Enviar telemetria ao Driver Hub"],
      e: "O nome precisa ser igual ao da configuração do robô no Driver Hub." },
    { q: "O que acontece se você esquecer telemetry.update()?",
      o: ["Os dados não aparecem no Driver Hub", "O robô para de andar", "O código não compila", "O motor inverte o sentido"],
      e: "addData só guarda a linha; update() é que envia tudo para a tela." }
  ],
  // Intermediário
  m: [
    { q: "Num drive tank, o robô anda torto para trás ao empurrar o joystick para frente. Qual o ajuste mais comum?",
      o: ["Inverter a direção de um dos lados com REVERSE", "Aumentar a tensão da bateria", "Trocar a câmera", "Usar setPower(2)"],
      e: "Os motores de um lado ficam espelhados, então um lado costuma precisar de REVERSE." },
    { q: "O que um encoder mede?",
      o: ["A rotação do motor, em ticks", "A temperatura do motor", "A cor de um objeto", "A tensão da bateria"],
      e: "O encoder conta ticks de rotação, que viram distância ou posição." },
    { q: "Qual a faixa de valores de setPosition() em um Servo?",
      o: ["0.0 a 1.0", "-1.0 a 1.0", "0 a 255", "0 a 360"],
      e: "A posição do servo vai de 0.0 a 1.0 (curso total)." },
    { q: "Qual valor left_stick_y tem com o joystick todo para frente?",
      o: ["-1.0", "1.0", "0", "100"],
      e: "No FTC o eixo Y é invertido: para frente é negativo." },
    { q: "O que o field-centric resolve?",
      o: ["O robô anda relativo ao campo, não para onde ele aponta", "A bateria dura mais", "O encoder zera sozinho", "Substitui o gamepad"],
      e: "Usa o heading do IMU para girar o vetor do joystick." },
    { q: "Por que usar uma máquina de estados em um mecanismo?",
      o: ["Para dividir em etapas sem travar o loop com sleep()", "Para usar mais memória", "Para evitar sensores", "Para remover o STOP"],
      e: "Estados nomeados deixam o loop rodando e o código mais fácil de testar." },
    { q: "O que o modo BRAKE faz quando a potência chega a zero?",
      o: ["Freia o motor ativamente", "Deixa o motor girar livre", "Desliga o Control Hub", "Inverte o sentido"],
      e: "BRAKE segura o motor; FLOAT deixa ele livre." }
  ],
  // Avançado
  h: [
    { q: "Em qual unidade vai o heading de uma Pose no Pedro Pathing?",
      o: ["Radianos", "Graus", "Ticks", "Polegadas"],
      e: "Use Math.toRadians() para converter graus." },
    { q: "No PID, para que serve o termo derivativo (D)?",
      o: ["Amortecer, reagindo à taxa de variação do erro", "Eliminar o erro acumulado", "Aumentar a potência máxima", "Zerar o encoder"],
      e: "O D reduz oscilações e ultrapassagens ao reagir à velocidade com que o erro muda." },
    { q: "O que acontece com a odometria ao longo de uma partida?",
      o: ["Pequenos erros se acumulam (deriva)", "Fica mais precisa sozinha", "Nada muda", "O heading vira exato"],
      e: "Erros pequenos se somam, por isso vale corrigir a posição com sensores ou visão." },
    { q: "O que fazer quando nenhuma AprilTag é detectada?",
      o: ["Tratar a lista vazia e usar uma alternativa segura", "Assumir que é a tag de ID 0", "Acessar get(0) direto", "Ignorar e seguir o autônomo"],
      e: "Acessar um item de uma lista vazia gera erro. Trate o caso e tenha um plano B." },
    { q: "Por que chamar follower.update() a cada volta do loop?",
      o: ["Para recalcular a correção da trajetória continuamente", "Para carregar a bateria", "Para ler o gamepad", "Para criar novos paths"],
      e: "Sem o update, o seguidor não corrige o robô durante o movimento." },
    { q: "Qual a vantagem de criar subsistemas (classes Drive, Garra)?",
      o: ["Organizar e reaproveitar o código em vários OpModes", "Gastar menos bateria", "Evitar compilar", "Substituir o hardwareMap"],
      e: "Cada mecanismo fica em uma classe própria, reutilizável no TeleOp e no autônomo." },
    { q: "Por que o termo integral (I) precisa de limite (anti-windup)?",
      o: ["Ele acumula erro e pode causar ultrapassagem e instabilidade", "Ele desliga o motor", "Ele zera o heading", "Ele troca a câmera"],
      e: "Sem limite, o acumulado cresce enquanto o mecanismo está travado e estoura depois." }
  ]
};
