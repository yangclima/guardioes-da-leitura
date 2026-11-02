import type { PhaseInput } from "./schemas";

export const SAMPLE_PHASE_INPUT: PhaseInput = {
  slug: "trilha-das-pistas",
  title: "Trilha das Pistas",
  description: "Leia com atenção e encontre as pistas escondidas nos textos.",
  theme: "floresta",
  mode: "misto",
  difficulty: 1,
  hearts: 3,
  active: true,
  questions: [
    {
      descriptor: "D1",
      supportText:
        "A coruja Sofia acordou antes do sol. Ajeitou as penas, observou a floresta silenciosa e partiu em busca do livro perdido da biblioteca do carvalho.",
      prompt: "O que a coruja Sofia foi procurar?",
      options: ["Um ninho novo", "O livro perdido da biblioteca", "Comida para os filhotes", "O nascer do sol"],
      correctIndex: 1,
      explanation: "O texto diz que ela partiu “em busca do livro perdido da biblioteca do carvalho”.",
    },
    {
      descriptor: "D3",
      supportText: "Depois de três dias de chuva, o rio estava tão cheio que parecia ter engolido a ponte.",
      prompt: "No trecho, a expressão “parecia ter engolido a ponte” significa que",
      options: [
        "a ponte foi destruída por um animal.",
        "a água cobriu a ponte.",
        "a ponte foi levada para longe.",
        "o rio secou depois da chuva.",
      ],
      correctIndex: 1,
      explanation: "É uma linguagem figurada: o rio subiu tanto que cobriu a ponte.",
    },
    {
      descriptor: "D4",
      supportText: "Marina abriu a janela, viu o céu escuro e voltou correndo para pegar o guarda-chuva.",
      prompt: "Pode-se concluir que Marina",
      options: [
        "achou que ia chover.",
        "estava atrasada para a escola.",
        "não gosta de dias de sol.",
        "perdeu o guarda-chuva.",
      ],
      correctIndex: 0,
      explanation: "O céu escuro e o guarda-chuva são pistas de que ela previu chuva — uma inferência.",
    },
  ],
};
