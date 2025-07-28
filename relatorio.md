<sup>Esse é um feedback gerado por IA, ele pode conter erros.</sup>

Você tem 6 créditos restantes para usar o sistema de feedback AI.

# Feedback para eduardavieira-dev:

Nota final: **72.1/100**

# Feedback para eduardavieira-dev 🚨🕵️‍♂️

Olá, Eduarda! Primeiro, quero parabenizar você pelo esforço e dedicação neste desafio de API para o Departamento de Polícia! 🎉 Seu projeto está bem estruturado, e dá para ver que você entendeu muito bem como organizar rotas, controllers e repositories. Isso já é meio caminho andado para construir APIs robustas e escaláveis. Vamos juntos destrinchar o que está funcionando e onde podemos melhorar para deixar sua API tinindo! ✨

---

## 🎯 Pontos Fortes que Merecem Destaque

- **Arquitetura modular bem aplicada:** Você separou muito bem as rotas (`routes/`), controladores (`controllers/`) e repositórios (`repositories/`). Isso mostra maturidade no desenvolvimento e facilita manutenção.
  
- **Implementação dos endpoints principais:** Os endpoints para `/agentes` e `/casos` existem e respondem, com tratamento de erros e validação usando Zod — ótima escolha para garantir integridade dos dados! 👏

- **Filtros básicos implementados:** Você já entregou filtros para casos por status e agente, além de filtragem de agentes por cargo e ordenação por data de incorporação — isso é um bônus que mostra atenção aos detalhes.

- **Tratamento de erros personalizado:** Você criou uma classe `ApiError` para padronizar erros, o que ajuda bastante na manutenção e clareza das mensagens.

Você está no caminho certo! Agora vamos conversar sobre os pontos que podem ser ajustados para sua API ficar ainda melhor. 😉

---

## 🔍 Análise Profunda dos Pontos que Precisam de Atenção

### 1. Atualização dos recursos permite alteração do campo `id` — e isso não pode!

**O que eu vi no seu código?**

No seu `agentesRepository.js`, o método `update` faz isso:

```js
const update = (id, newData) => {
    const agente = agentes.find(agente => agente.id === id);
    if (!agente) return null;

    // Ignorar qualquer id que venha em newData
    const { id: _, ...dadosSemId } = newData;

    const requiredFields = ['nome', 'dataDeIncorporacao', 'cargo'];
    const hasAllFields = requiredFields.every(field => dadosSemId.hasOwnProperty(field));
    if (!hasAllFields) return null; 

    agente.nome = dadosSemId.nome;
    agente.dataDeIncorporacao = dadosSemId.dataDeIncorporacao;
    agente.cargo = dadosSemId.cargo;

    return agente;
}
```

Aqui você até ignora o `id` que venha no payload, o que é ótimo. Porém, o problema está que no controller, na hora de validar ou aplicar a atualização, você não impede que o campo `id` seja enviado e aceito pelo Zod, e o mesmo acontece no `partialUpdate`.

Isso pode permitir, em algumas situações, que o `id` seja modificado, ou pelo menos que o payload contenha esse campo, o que não é desejável.

**Por que isso é importante?**

O `id` é a identidade única do recurso e não deve ser alterado pela API. Permitir sua alteração pode causar inconsistências e bugs difíceis de debugar.

**Como corrigir?**

- Ajuste o schema Zod para que o campo `id` não seja esperado ou permitido no payload de criação ou atualização.
- No controller, rejeite qualquer payload que contenha o campo `id`.
- No repositório, continue ignorando o `id` para garantir segurança.

Por exemplo, no schema Zod para agentes, você pode definir:

```js
const agenteSchema = z.object({
  nome: z.string().min(2),
  dataDeIncorporacao: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Data inválida' }),
  cargo: z.string().min(2),
  // Não incluir 'id' no schema de validação do payload
});
```

E no controller, antes de validar, faça algo assim:

```js
if ('id' in req.body) {
  return res.status(400).json({ message: 'Não é permitido alterar o campo id' });
}
```

Isso garante que o `id` nunca será alterado.

**Recurso para estudar:**

- Validação de dados e tratamento de erros: https://youtu.be/yNDCRAz7CM8?si=Lh5u3j27j_a4w3A_
- Status 400 para dados inválidos: https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status/400

---

### 2. Falhas na atualização completa (PUT) e parcial (PATCH) para agentes e casos

**O que eu vi no seu código?**

Você implementou os métodos `update` e `partialUpdate` tanto para agentes quanto para casos, mas há algumas sutilezas:

- No método `update` do repositório, você exige que todos os campos obrigatórios estejam presentes, o que é correto para PUT.
- No controller, você faz a validação Zod no payload completo, o que é adequado.
- No entanto, os testes indicam que, ao enviar payloads incorretos, o status 400 nem sempre é retornado corretamente.

Por exemplo, no `agentesController.js`:

```js
const updateAgente = (req, res, next) => {
    // ...
    const data = agenteSchema.parse(dadosRecebidos);
    const agenteAtualizado = agentesRepository.update(id, data);

    if (!agenteAtualizado) {
        throw new ApiError('Agente não encontrado', 404);
    }
    res.status(200).json({
        message: 'Agente atualizado com sucesso',
        data: agenteAtualizado
    });
};
```

Se o payload estiver com formato incorreto, o Zod lança erro, e você trata isso, o que é ótimo. Porém, no repositório, se o `update` retornar null (por exemplo, porque campos obrigatórios faltam), você está retornando 404, o que pode confundir.

**Por que isso acontece?**

Se o `update` retorna null porque o payload está incompleto, o correto seria retornar 400 (Bad Request), não 404 (Not Found).

**Como corrigir?**

No controller, diferencie o caso de "recurso não encontrado" do caso de "payload inválido". Uma forma é ajustar o repositório para lançar erros ou retornar códigos diferentes, ou no controller verificar se todos os campos obrigatórios existem antes de chamar o repositório.

Outra dica: no método `update` do repositório, se os campos obrigatórios não estiverem presentes, retorne um erro ou lance uma exceção, para que o controller possa responder com 400.

**Recurso para estudar:**

- Status 400 e 404: https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status/400
- Tratamento de erros em APIs Node.js: https://youtu.be/yNDCRAz7CM8?si=Lh5u3j27j_a4w3A_

---

### 3. Filtros avançados e busca por palavras-chave não implementados completamente

Você implementou filtros básicos para casos e agentes, e isso é ótimo! Porém, percebi que o filtro de busca por palavras-chave no título ou descrição dos casos (`q` no query) não está funcionando conforme esperado.

No `casosController.js`, você tem:

```js
if (q) {
    const searchTerm = q.toLowerCase();
    casos = casos.filter(caso => 
        caso.titulo.toLowerCase().includes(searchTerm) ||
        caso.descricao.toLowerCase().includes(searchTerm)
    );
}
```

Isso parece correto, mas os testes indicam que pode estar falhando.

**Por que pode estar falhando?**

- Talvez o campo `descricao` ou `titulo` estejam vazios ou não strings em algum caso.
- Ou pode ser que a query string esteja chegando com espaços ou caracteres especiais.

**Como melhorar?**

- Garanta que `titulo` e `descricao` sempre sejam strings antes de chamar `.toLowerCase()`.
- Trate casos com strings vazias ou `null`.
- Faça um `trim()` na query para evitar espaços em branco.

Exemplo:

```js
if (q) {
    const searchTerm = q.trim().toLowerCase();
    casos = casos.filter(caso => 
        (caso.titulo && caso.titulo.toLowerCase().includes(searchTerm)) ||
        (caso.descricao && caso.descricao.toLowerCase().includes(searchTerm))
    );
}
```

---

### 4. Falta do endpoint para buscar o agente responsável por um caso (bonus)

Você já criou a rota `/casos/:caso_id/agente` e o controller correspondente, o que é fantástico! Porém, os testes indicam que esse endpoint não está funcionando corretamente.

No seu controller `getAgenteDoCaso`, você faz:

```js
const getAgenteDoCaso = (req, res, next) => {
    const { caso_id } = req.params;
    try {
        const caso = casosRepository.findById(caso_id);
        if (!caso) {
            throw new ApiError('Caso não encontrado', 404);
        }
        
        const agente = agentesRepository.findById(caso.agente_id);
        if (!agente) {
            throw new ApiError('Agente do caso não encontrado', 404);
        }
        
        res.status(200).json(agente);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao buscar agente do caso', 500));
    }
};
```

Isso está correto na teoria, mas verifique se a rota está realmente sendo chamada no `casosRoutes.js` e se o parâmetro `caso_id` está correto.

**Dica:** Teste esse endpoint isoladamente com ferramentas como Postman ou Insomnia para garantir que está funcionando.

---

### 5. Organização do projeto está ótima!

Sua estrutura de diretórios está alinhada com o que esperamos:

```
.
├── controllers
│   ├── agentesController.js
│   └── casosController.js
├── repositories
│   ├── agentesRepository.js
│   └── casosRepository.js
├── routes
│   ├── agentesRoutes.js
│   └── casosRoutes.js
├── utils
│   ├── agentesValidation.js
│   ├── casosValidation.js
│   └── errorHandler.js
├── docs
│   └── swagger.js
├── server.js
├── package.json
```

Parabéns por manter essa organização! Isso ajuda demais na escalabilidade do projeto.

---

## 📚 Recursos que Recomendo para Você Estudar

- **Express.js e Rotas:**  
  https://expressjs.com/pt-br/guide/routing.html  
  (Para entender melhor como organizar e criar rotas com `express.Router()`.)

- **Validação de Dados com Zod e tratamento de erros:**  
  https://youtu.be/yNDCRAz7CM8?si=Lh5u3j27j_a4w3A_  
  (Para garantir que seus schemas validem corretamente e você trate erros 400 com mensagens claras.)

- **Status HTTP e boas práticas em APIs REST:**  
  https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status/400  
  https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status/404  
  (Para entender quando usar cada código e retornar respostas adequadas.)

- **Manipulação de Arrays em JavaScript:**  
  https://youtu.be/glSgUKA5LjE?si=t9G2NsC8InYAU9cI  
  (Para aprimorar filtros, buscas e ordenações em listas na memória.)

---

## ✨ Resumo dos Principais Pontos para Melhorar

- ❌ **Bloquear atualização do campo `id`** nos payloads PUT e PATCH para agentes e casos.
- ❌ **Garantir que payloads incompletos ou mal formatados retornem 400**, não 404, especialmente em métodos PUT.
- ❌ **Aprimorar filtro de busca por palavra-chave** para evitar erros com dados vazios ou tipos inadequados.
- ❌ **Verificar funcionamento do endpoint `/casos/:caso_id/agente`** para garantir que retorna o agente correto.
- ✅ Manter a excelente organização do projeto e o uso de Zod para validação.
- ✅ Continuar investindo em tratamento de erros customizados e mensagens claras.

---

## Para Finalizar 🚀

Eduarda, você está muito bem encaminhada! Seu código mostra que você já domina conceitos importantes de Node.js, Express e arquitetura de APIs REST. Com pequenos ajustes na validação e tratamento de erros, seu projeto vai ficar ainda mais robusto e alinhado com as melhores práticas. Continue praticando e explorando as dicas e recursos que te passei aqui — isso vai te levar longe! 💪✨

Se precisar de ajuda para implementar algum desses pontos, só me chamar! Estou aqui para te apoiar nessa jornada de aprendizado. Vamos juntos! 👩‍💻👨‍💻

Um abraço de Code Buddy! 🤖❤️

---

**PS:** Não esqueça de testar seus endpoints com ferramentas como Postman para garantir que tudo está respondendo com os status e dados esperados. Isso ajuda muito a encontrar pequenos detalhes antes de entregar. 😉

---

Até a próxima revisão! 🌟

> Caso queira tirar uma dúvida específica, entre em contato com o Chapter no nosso [discord](https://discord.gg/DryuHVnz).



---
<sup>Made By the Autograder Team.</sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Carvalho](https://github.com/ArthurCRodrigues)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Drumond](https://github.com/drumondpucminas)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Gabriel Resende](https://github.com/gnvr29)</sup></sup>