const {v4 : uuidv4} = require('uuid');

const agentes = [
    {
        id: "550e8400-e29b-41d4-a716-446655440001",
        nome: 'Agente Um',
        dataDeIncorporacao: new Date('2022-01-15'),
        cargo: 'Supervisor'
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440002",
        nome: 'Agente Dois',
        dataDeIncorporacao: new Date('2023-03-10'),
        cargo: 'Analista'
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

    const requiredFields = ['nome', 'dataDeIncorporacao', 'cargo'];
    const hasAllFields = requiredFields.every(field => newData.hasOwnProperty(field));
    if (!hasAllFields) return null; 

    agente.nome = newData.nome;
    agente.dataDeIncorporacao = new Date(newData.dataDeIncorporacao);
    agente.cargo = newData.cargo;

    return agente;
}

const partialUpdate = (id, data) => {
    const agente = agentes.find(agente => agente.id === id);
    if (!agente) return null;

    Object.assign(agente, data);
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