const {v4 : uuidv4} = require('uuid');

const agentes = [
    {
        id: "550e8400-e29b-41d4-a716-446655440001",
        nome: 'Agente Um',
        dataDeIncorporacao: '2022-01-15',
        cargo: 'supervisor'
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440002",
        nome: 'Agente Dois',
        dataDeIncorporacao: '2023-03-10',
        cargo: 'analista'
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440003",
        nome: 'Agente Três',
        dataDeIncorporacao: '2021-05-20',
        cargo: 'delegado'
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440004",
        nome: 'Agente Quatro',
        dataDeIncorporacao: '2024-02-08',
        cargo: 'investigador'
    }
];

const findAll = () => {
    return agentes; 
}

const findById = (id) => {
    return agentes.find(agente => agente.id === id);
}

const create = (data) => {
    const novoAgente = {
        id: uuidv4(),
        ...data
    };
    agentes.push(novoAgente);
    return novoAgente;
}

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

const partialUpdate = (id, data) => {
    const agente = agentes.find(agente => agente.id === id);
    if (!agente) return null;

    // Ignorar qualquer id que venha em data
    const { id: _, ...dadosSemId } = data;

    Object.assign(agente, dadosSemId);
    return agente;
};

const remove = (id) =>{
    const agenteIndex = agentes.findIndex(agente => agente.id === id);
    if (agenteIndex === -1) return null;

    const [deletedAgente] = agentes.splice(agenteIndex, 1);
    return deletedAgente;
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    partialUpdate,
    remove
};