const agentesRepository = require('../repositories/agentesRepository');
const { agenteSchema, formatZodError } = require('../utils/agentesValidation');
const { ZodError } = require('zod');

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
        let agentes = agentesRepository.findAll();
        
        if (cargo) {
            agentes = agentes.filter(agente =>
            typeof agente.cargo === 'string' &&
            agente.cargo.toLowerCase() === cargo.toLowerCase()
            );
        }

        if (sort) {
            const ordem = sort.startsWith('-') ? -1 : 1;
            const campo = sort.replace('-', '');
            if (campo === 'dataDeIncorporacao') {
                agentes = agentes.sort((a, b) => {
                    const dateA = new Date(a.dataDeIncorporacao);
                    const dateB = new Date(b.dataDeIncorporacao);
                    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                    if (isNaN(dateA.getTime())) return 1 * ordem;
                    if (isNaN(dateB.getTime())) return -1 * ordem;
                    return ordem * (dateA.getTime() - dateB.getTime());
                });
            } else if (campo === 'nome') {
                agentes = agentes.sort((a, b) => 
                    ordem * a.nome.localeCompare(b.nome)
                );
            } else if (campo === 'cargo') {
                agentes = agentes.sort((a, b) => 
                    ordem * a.cargo.localeCompare(b.cargo)
                );
            }
        }
        res.status(200).json(agentes);
    } catch (error) {
        next(new ApiError('Erro ao buscar agentes'));
    }
};

const getAgenteById = (req, res, next) => {
    const { id } = req.params;
    try {
        const agente = agentesRepository.findById(id);
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

        const dataDeIncorporacaoDate = new Date(dataDeIncorporacao);

        if (isNaN(dataDeIncorporacaoDate.getTime())) {
            throw new ApiError('Data de incorporação inválida', 400);
        }

        const now = new Date();
        if (dataDeIncorporacaoDate > now) {
            throw new ApiError('Data de incorporação não pode ser futura', 400);
        }

        const dadosRecebidos = {
            nome,
            dataDeIncorporacao: dataDeIncorporacao,
            cargo: cargo?.toLowerCase()
        };

        const data = agenteSchema.parse(dadosRecebidos);
        const novoAgente = agentesRepository.create(data);
        res.status(201).json(novoAgente);
    } catch (error) {
        if (error instanceof ZodError) {
            const formattedError = formatZodError(error);
            return res.status(400).json(formattedError);
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
        const { id: idDoPayload, ...dadosSemId } = req.body; // Remove id do payload
        const { nome, dataDeIncorporacao, cargo } = dadosSemId;
        
        const dadosRecebidos = {
            nome,
            dataDeIncorporacao: dataDeIncorporacao,
            cargo: cargo?.toLowerCase()
        };
        const data = agenteSchema.parse(dadosRecebidos);
        const agenteAtualizado = agentesRepository.update(id, data);

        if (!agenteAtualizado) {
            throw new ApiError('Agente não encontrado', 404);
        }
         res.status(200).json({
            message: 'Agente atualizado com sucesso',
            data: agenteAtualizado
        });
    } catch (error) {
        if (error instanceof ZodError) {
            const formattedError = formatZodError(error);
            return res.status(400).json(formattedError);
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
        const { id: idDoPayload, ...dadosSemId } = req.body; // Remove id do payload
        const { nome, dataDeIncorporacao, cargo } = dadosSemId;

        const dadosRecebidos = {};
        if (nome !== undefined) dadosRecebidos.nome = nome;
        if (dataDeIncorporacao !== undefined) dadosRecebidos.dataDeIncorporacao = dataDeIncorporacao;
        if (cargo !== undefined) dadosRecebidos.cargo = cargo.toLowerCase();

        const data = agenteSchema.partial().parse(dadosRecebidos);

        const agenteAtualizado = agentesRepository.partialUpdate(id, data);

        if (!agenteAtualizado) {
            return next(new ApiError('Agente não encontrado', 404));
        }

        res.status(200).json({
            message: 'Agente atualizado com sucesso',
            data: agenteAtualizado
        });

    } catch (error) {
        if (error instanceof ZodError) {
            const formattedError = formatZodError(error);
            return res.status(400).json(formattedError);
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
        const agenteDeletado = agentesRepository.remove(id);
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