const agenteRepository = require('../repositories/agentesRepository');
const { agenteSchema } = require('../utils/agentesValidation')

class ApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
    }
}

const getAgentes = (req, res, next) => {
    try {
        const { cargo, sort } = req.query;
        let agentes = agenteRepository.findAll();
        
        if (cargo) {
            agentes = agentes.filter(agente => 
                agente.cargo.toLowerCase() === cargo.toLowerCase()
            );
        }
        
        if (sort === 'dataDeIncorporacao') {
            agentes = agentes.sort((a, b) => 
                new Date(a.dataDeIncorporacao) - new Date(b.dataDeIncorporacao)
            );
        }
        
        res.status(200).json(agentes);
    } catch (error) {
        next(new ApiError('Erro ao buscar agentes'));
    }
};

const getAgenteById = (req, res, next) => {
    const { id } = req.params;
    try {
        const agente = agenteRepository.findById(id);
        if (!agente) {
            throw new ApiError('Agente não encontrado', 404);
        }
        res.status(200).json(agente);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao buscar agente', 500));
    }
};

const createAgente = (req, res, next) => {
    try {
        const { nome, dataDeIncorporacao, cargo } = req.body;

        if (!nome || !dataDeIncorporacao || !cargo) {
            throw new ApiError('Campos obrigatórios: nome, dataDeIncorporacao, cargo', 400);
        }

        const dadosRecebidos = {
            nome,
            dataDeIncorporacao: new Date(dataDeIncorporacao),
            cargo: cargo?.toLowerCase()
        }

        if (isNaN(dadosRecebidos.dataDeIncorporacao.getTime())) {
            throw new ApiError('Data de incorporação inválida', 400);
        }

        const data = agenteSchema.parse(dadosRecebidos);
        const novoAgente = agenteRepository.create(data);
        res.status(201).json(novoAgente);
    } catch (error) {
        if (error.name === 'ZodError') {
            return next(error); 
        }
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao criar agente', 500));
    }
};

const updateAgente = (req, res, next) => {
    const { id } = req.params;
    try {
        const { nome, dataDeIncorporacao, cargo } = req.body;
        const dadosRecebidos = {
            nome,
            dataDeIncorporacao: new Date(dataDeIncorporacao),
            cargo: cargo?.toLowerCase()
        };
        const data = agenteSchema.parse(dadosRecebidos);
        const agenteAtualizado = agenteRepository.update(id, data);

        if (!agenteAtualizado) {
            throw new ApiError('Agente não encontrado', 404);
        }
         res.status(200).json({
            message: 'Agente atualizado com sucesso',
            data: agenteAtualizado
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return next(error);
        }
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao atualizar agente', 500));
    }
};

const partialUpdateAgente = (req, res, next) => {
    const { id } = req.params;
    try {
        const { nome, dataDeIncorporacao, cargo } = req.body;

        const dadosRecebidos = {};
        if (nome !== undefined) dadosRecebidos.nome = nome;
        if (dataDeIncorporacao !== undefined) dadosRecebidos.dataDeIncorporacao = new Date(dataDeIncorporacao);
        if (cargo !== undefined) dadosRecebidos.cargo = cargo.toLowerCase();

        const data = agenteSchema.partialParse(dadosRecebidos);

        const agenteAtualizado = agenteRepository.partialUpdate(id, data);

        if (!agenteAtualizado) {
            return next(new ApiError('Agente não encontrado', 404));
        }

        res.status(200).json({
            message: 'Agente atualizado com sucesso',
            data: agenteAtualizado
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return next(error);
        }
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao atualizar agente', 500));
    }
};

const deleteAgente = (req, res, next) => {
    const { id } = req.params;
    try {
        const agenteDeletado = agenteRepository.remove(id);
        if (!agenteDeletado) {
            throw new ApiError('Agente não encontrado', 404);
        }
        res.status(204).send();

    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao deletar agente', 500));
    }
};

module.exports = {
    getAgentes,
    getAgenteById,
    createAgente,
    updateAgente,
    partialUpdateAgente,
    deleteAgente
};