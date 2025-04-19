const express = require("express");
const cors = require("cors");
const mysql = require('mysql2/promise');
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: 'switchback.proxy.rlwy.net',
    port: 54582,
    user: 'root',
    password: 'XGHNbPlETOYsCGhxymjHVeJmVaTZdtiZ',
    database: 'railway',
};

async function connectDB() {
    try {
        console.log("Conectando ao banco de dados...");
        const connection = await mysql.createConnection(dbConfig);
        console.log("Conexão com o banco de dados bem-sucedida!");
        return connection;
    } catch (err) {
        console.error("Erro ao conectar ao banco de dados:", err);
        throw new Error("Falha ao conectar ao banco.");
    }
}

// Rotas para Categorias

app.post("/categorias", async (req, res) => {
    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ error: "Nome da categoria é obrigatório." });
    }

    try {
        const db = await connectDB();

        // Verificando se a categoria já existe
        const [existe] = await db.execute("SELECT id FROM categorias WHERE nome = ?", [nome]);
        if (existe.length > 0) {
            return res.status(400).json({ error: "Categoria já existe!" });
        }

        // Inserindo nova categoria
        const [result] = await db.execute("INSERT INTO categorias (nome) VALUES (?)", [nome]);

        res.json({ id: result.insertId, nome, message: "Categoria cadastrada com sucesso!" });
    } catch (err) {
        console.error("Erro ao cadastrar categoria:", err);
        res.status(500).json({ error: "Erro ao cadastrar categoria." });
    }
});

app.get("/categorias", async (req, res) => {
    try {
        const db = await connectDB();
        const [categorias] = await db.execute("SELECT * FROM categorias");
        res.json(categorias);
    } catch (err) {
        console.error("Erro ao buscar categorias:", err);
        res.status(500).json({ error: "Erro ao buscar categorias." });
    }
});

app.delete("/categorias/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const db = await connectDB();
        await db.execute("DELETE FROM categorias WHERE id = ?", [id]);
        res.json({ message: "Categoria excluída com sucesso!" });
    } catch (err) {
        console.error("Erro ao excluir categoria:", err);
        res.status(500).json({ error: "Erro ao excluir categoria." });
    }
});

// Rotas para Pratos

app.post("/pratos", async (req, res) => {
    const { nome, preco, categoriaId, restaurant_id } = req.body;

    if (!nome || !preco || !categoriaId || !restaurant_id) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
    }

    try {
        const db = await connectDB();

        const [cat] = await db.execute("SELECT nome FROM categorias WHERE id = ?", [categoriaId]);
        if (cat.length === 0) return res.status(400).json({ error: "Categoria não encontrada." });

        const categoriaNome = cat[0].nome;

        // Garantir que o preço seja um número
        const precoFormatado = parseFloat(preco);
        if (isNaN(precoFormatado)) {
            return res.status(400).json({ error: "Preço inválido." });
        }

        const [result] = await db.execute(
            "INSERT INTO pratos (nome, preco, categoria_id, categoria_nome, restaurant_id) VALUES (?, ?, ?, ?, ?)",
            [nome, precoFormatado, categoriaId, categoriaNome, restaurant_id]
        );

        res.json({
            id: result.insertId,
            nome,
            preco: precoFormatado,
            categoria: categoriaNome,
            restaurant_id,
            message: "Prato cadastrado com sucesso!"
        });
    } catch (err) {
        console.error("Erro ao cadastrar prato:", err);
        res.status(500).json({ error: "Erro ao cadastrar prato." });
    }
});

app.get("/pratos", async (req, res) => {
    try {
        const db = await connectDB();
        const [pratos] = await db.execute("SELECT * FROM pratos");

        // Garantir que o preço seja um número ao enviar para o front-end
        const pratosComPrecoFormatado = pratos.map(prato => {
            return {
                ...prato,
                preco: parseFloat(prato.preco)  // Forçar conversão para número
            };
        });

        res.json(pratosComPrecoFormatado);
    } catch (err) {
        console.error("Erro ao buscar pratos:", err);
        res.status(500).json({ error: "Erro ao buscar pratos." });
    }
});

app.delete("/pratos/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const db = await connectDB();
        await db.execute("DELETE FROM pratos WHERE id = ?", [id]);
        res.json({ message: "Prato excluído com sucesso!" });
    } catch (err) {
        console.error("Erro ao excluir prato:", err);
        res.status(500).json({ error: "Erro ao excluir prato." });
    }
});

app.put("/pratos/:id/preco", async (req, res) => {
    const { id } = req.params;
    const { preco } = req.body;

    try {
        const db = await connectDB();

        // Garantir que o preço seja um número
        const precoFormatado = parseFloat(preco);
        if (isNaN(precoFormatado)) {
            return res.status(400).json({ error: "Preço inválido." });
        }

        await db.execute("UPDATE pratos SET preco = ? WHERE id = ?", [precoFormatado, id]);
        res.json({ message: "Preço atualizado com sucesso!" });
    } catch (err) {
        console.error("Erro ao atualizar preço:", err);
        res.status(500).json({ error: "Erro ao atualizar preço." });
    }
});

// Servir index.html
app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000!"));