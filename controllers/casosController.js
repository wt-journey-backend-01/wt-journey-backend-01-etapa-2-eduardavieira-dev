const casosRepository = require('../repositories/casosRepository');
const agentesRepository = require('../repositories/agentesRepository');
const { casoSchema } = require('../utils/casosValidation');

class ApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
    }
}

const getCasos = (req, res, next) => {
    try {
        const { agente_id, status, q } = req.query;
        let casos = casosRepository.findAll();
        
        if (agente_id) {
            casos = casos.filter(caso => caso.agente_id === agente_id);
        }
        
        if (status) {
            casos = casos.filter(caso => 
                caso.status.toLowerCase() === status.toLowerCase()
            );
        }
        
        // Buscar por termo se fornecido
        if (q) {
            const searchTerm = q.toLowerCase();
            casos = casos.filter(caso => 
                caso.titulo.toLowerCase().includes(searchTerm) ||
                caso.descricao.toLowerCase().includes(searchTerm)
            );
        }
        
        res.status(200).json(casos);
    } catch (error) {
        next(new ApiError('Erro ao buscar casos', 500));
    }
};

const getCasoById = (req, res, next) => {
    const { id } = req.params;
    try {
        const caso = casosRepository.findById(id);
        if (!caso) {
            throw new ApiError('Caso não encontrado', 404);
        }
        res.status(200).json(caso);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao buscar caso', 500));
    }
};

const createCaso = (req, res, next) => {
    try {
        const { titulo, descricao, status, agente_id } = req.body;

        if (!titulo || !descricao || !agente_id) {
            throw new ApiError('Campos obrigatórios: titulo, descricao, agente_id', 400);
        }

        const agenteExiste = agentesRepository.findById(agente_id);
        if (!agenteExiste) {
            throw new ApiError('Agente não encontrado. Verifique se o agente_id é válido.', 404);
        }

        const dadosRecebidos = {
            titulo,
            descricao,
            status: status?.toLowerCase() || 'aberto',
            agente_id
        };

        const data = casoSchema.parse(dadosRecebidos);
        const novoCaso = casosRepository.create(data);
    

        res.status(201).json(novoCaso);
    } catch (error) {
        if (error.name === 'ZodError') {
            return next(error);
        }
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao criar caso', 500));
    }
};

const updateCaso = (req, res, next) => {
    const { id } = req.params;
    try {
        const { titulo, descricao, status, agente_id } = req.body;
        
        // Verificar se o agente existe antes de atualizar o caso (se agente_id foi fornecido)
        if (agente_id) {
            const agenteExiste = agentesRepository.findById(agente_id);
            if (!agenteExiste) {
                throw new ApiError('Agente não encontrado. Verifique se o agente_id é válido.', 404);
            }
        }
        
        const dadosRecebidos = {
            titulo,
            descricao,
            status: status?.toLowerCase(),
            agente_id
        };
        const data = casoSchema.parse(dadosRecebidos);
        const casoAtualizado = casosRepository.update(id, data);

        if (!casoAtualizado) {
            throw new ApiError('Caso não encontrado', 404);
        }
        res.status(200).json({
            message: 'Caso atualizado com sucesso',
            data: casoAtualizado
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return next(error);
        }
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao atualizar caso', 500));
    }
};

const partialUpdateCaso = (req, res, next) => {
    const { id } = req.params;
    try {
        const { titulo, descricao, status, agente_id } = req.body;

        const dadosRecebidos = {};
        if (titulo !== undefined) dadosRecebidos.titulo = titulo;
        if (descricao !== undefined) dadosRecebidos.descricao = descricao;
        if (status !== undefined) dadosRecebidos.status = status.toLowerCase();
        if (agente_id !== undefined) {
            const agenteExiste = agentesRepository.findById(agente_id);
            if (!agenteExiste) {
                throw new ApiError('Agente não encontrado. Verifique se o agente_id é válido.', 404);
            }
            dadosRecebidos.agente_id = agente_id;
        }

        const data = casoSchema.partialParse(dadosRecebidos);

        const casoAtualizado = casosRepository.partialUpdate(id, data);

        if (!casoAtualizado) {
            return next(new ApiError('Caso não encontrado', 404));
        }

        res.status(200).json({
            message: 'Caso atualizado com sucesso',
            data: casoAtualizado
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return next(error);
        }
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao atualizar caso', 500));
    }
};

const deleteCaso = (req, res, next) => {
    const { id } = req.params;
    try {
        const casoDeletado = casosRepository.remove(id);
        if (!casoDeletado) {
            throw new ApiError('Caso não encontrado', 404);
        }
        res.status(204).send();
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError('Erro ao deletar caso', 500));
    }
};

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

module.exports = {
    getCasos,
    getCasoById,
    createCaso,
    updateCaso,
    partialUpdateCaso,
    deleteCaso,
    getAgenteDoCaso
};
