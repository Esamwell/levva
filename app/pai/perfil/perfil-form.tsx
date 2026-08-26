"use client";

import { useState } from "react";
import { School, Pencil, Plus, Baby } from "lucide-react";
import { Card, CardContent, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";

type Escola = { id: string; nome: string };
type Filho = { id: string; nome: string; escola: Escola };

const campo =
  "w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm outline-none focus:border-amber";

function BuscaEscola({
  valor,
  excluir,
  onEscolher,
}: {
  valor: string;
  excluir: string[];
  onEscolher: (escola: Escola) => void;
}) {
  const [busca, setBusca] = useState(valor);
  const [sugestoes, setSugestoes] = useState<Escola[]>([]);

  async function buscar(texto: string) {
    setBusca(texto);
    if (texto.trim().length < 2) {
      setSugestoes([]);
      return;
    }
    const res = await fetch(`/api/escolas?q=${encodeURIComponent(texto)}`);
    const data = await res.json();
    setSugestoes(data.escolas.filter((e: Escola) => !excluir.includes(e.id)));
  }

  return (
    <div className="relative">
      <input
        value={busca}
        onChange={(e) => buscar(e.target.value)}
        placeholder="Escola do filho"
        className={campo}
      />
      {sugestoes.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-cream-line bg-white shadow-lg">
          {sugestoes.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                onEscolher(e);
                setBusca(e.nome);
                setSugestoes([]);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-cream"
            >
              <School className="h-3.5 w-3.5 text-ink-soft" /> {e.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaFilho({ filho, onSalvo }: { filho: Filho; onSalvo: (filho: Filho) => void }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(filho.nome);
  const [escola, setEscola] = useState<Escola>(filho.escola);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/pai/filhos/${filho.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, escolaId: escola.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não deu pra salvar.");
      onSalvo(data.filho);
      setEditando(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (!editando) {
    return (
      <li className="flex items-center justify-between rounded-xl border border-cream-line px-4 py-3">
        <div>
          <p className="text-sm font-medium text-navy">{filho.nome}</p>
          <p className="flex items-center gap-1 text-xs text-ink-soft">
            <School className="h-3 w-3" /> {filho.escola.nome}
          </p>
        </div>
        <button
          onClick={() => setEditando(true)}
          className="flex items-center gap-1 text-xs font-semibold text-sage hover:underline"
        >
          <Pencil className="h-3 w-3" /> Editar
        </button>
      </li>
    );
  }

  return (
    <li className="space-y-2 rounded-xl border border-amber bg-amber-soft/10 px-4 py-3">
      <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do filho" className={campo} />
      <BuscaEscola valor={escola.nome} excluir={[]} onEscolher={setEscola} />
      {erro && <p className="text-xs text-red-600">{erro}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setEditando(false);
            setNome(filho.nome);
            setEscola(filho.escola);
            setErro(null);
          }}
          className="flex-1 rounded-full border border-cream-line py-1.5 text-xs font-semibold text-ink-soft"
        >
          Cancelar
        </button>
        <Button size="sm" disabled={salvando} onClick={salvar} className="flex-1 bg-navy text-xs text-white hover:bg-navy/90">
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </li>
  );
}

export default function PerfilForm({
  conta,
  endereco: enderecoInicial,
  cpfCnpj: cpfCnpjInicial,
  filhosIniciais,
}: {
  conta: { nome: string; email: string; telefone: string };
  endereco: string;
  cpfCnpj: string | null;
  filhosIniciais: Filho[];
}) {
  const [telefone, setTelefone] = useState(conta.telefone);
  const [endereco, setEndereco] = useState(enderecoInicial);
  const [cpfCnpj, setCpfCnpj] = useState(cpfCnpjInicial ?? "");
  const [salvandoConta, setSalvandoConta] = useState(false);
  const [mensagemConta, setMensagemConta] = useState<string | null>(null);
  const [erroConta, setErroConta] = useState<string | null>(null);

  const [filhos, setFilhos] = useState<Filho[]>(filhosIniciais);
  const [novoNome, setNovoNome] = useState("");
  const [novaEscola, setNovaEscola] = useState<Escola | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [erroNovo, setErroNovo] = useState<string | null>(null);
  // Muda a cada cadastro bem-sucedido pra remontar BuscaEscola e limpar o
  // campo de texto interno dela (que não é controlado por fora).
  const [buscaKey, setBuscaKey] = useState(0);

  async function salvarConta() {
    setSalvandoConta(true);
    setErroConta(null);
    setMensagemConta(null);
    try {
      const res = await fetch("/api/pai/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, endereco, cpfCnpj }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não deu pra salvar.");
      setMensagemConta("Dados salvos!");
    } catch (e) {
      setErroConta(e instanceof Error ? e.message : "Não deu pra salvar.");
    } finally {
      setSalvandoConta(false);
    }
  }

  async function adicionarFilho() {
    if (!novoNome.trim() || !novaEscola) {
      setErroNovo("Preencha o nome e a escola.");
      return;
    }
    setAdicionando(true);
    setErroNovo(null);
    try {
      const res = await fetch("/api/pai/filhos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome, escolaId: novaEscola.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não deu pra cadastrar.");
      setFilhos((prev) => (prev.some((f) => f.id === data.filho.id) ? prev : [...prev, data.filho]));
      setNovoNome("");
      setNovaEscola(null);
      setBuscaKey((k) => k + 1);
    } catch (e) {
      setErroNovo(e instanceof Error ? e.message : "Não deu pra cadastrar.");
    } finally {
      setAdicionando(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <Card className="h-fit border-cream-line shadow-none">
        <CardContent className="space-y-4 p-6">
          <CardTitle className="text-sm uppercase tracking-wide text-ink-soft">Meus dados</CardTitle>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Nome</label>
            <p className="rounded-xl border border-cream-line bg-cream px-4 py-2.5 text-sm text-ink-soft">{conta.nome}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">E-mail</label>
            <p className="rounded-xl border border-cream-line bg-cream px-4 py-2.5 text-sm text-ink-soft">{conta.email}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">WhatsApp</label>
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={campo} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Endereço</label>
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className={campo} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">CPF ou CNPJ</label>
            <input
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              placeholder="Só números"
              className={campo}
            />
            <p className="mt-1 text-xs text-ink-soft">Usado só pra emitir a cobrança do transporte.</p>
          </div>

          {erroConta && <p className="text-xs text-red-600">{erroConta}</p>}
          {mensagemConta && <p className="text-xs text-sage">{mensagemConta}</p>}

          <Button onClick={salvarConta} disabled={salvandoConta} className="bg-navy text-white hover:bg-navy/90">
            {salvandoConta ? "Salvando..." : "Salvar dados"}
          </Button>
        </CardContent>
      </Card>

      <Card className="h-fit border-cream-line shadow-none">
        <CardContent className="space-y-4 p-6">
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-ink-soft">
            <Baby className="h-4 w-4" /> Meus filhos
          </CardTitle>

          {filhos.length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhum filho cadastrado ainda.</p>
          ) : (
            <ul className="space-y-2">
              {filhos.map((f) => (
                <LinhaFilho
                  key={f.id}
                  filho={f}
                  onSalvo={(atualizado) => setFilhos((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)))}
                />
              ))}
            </ul>
          )}

          <Separator className="bg-cream-line" />

          <div className="space-y-2">
            <CardTitle className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <Plus className="h-3.5 w-3.5" /> Adicionar filho
            </CardTitle>
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do filho" className={campo} />
            <BuscaEscola key={buscaKey} valor="" excluir={[]} onEscolher={setNovaEscola} />
            {erroNovo && <p className="text-xs text-red-600">{erroNovo}</p>}
            <Button
              size="sm"
              variant="outline"
              disabled={adicionando}
              onClick={adicionarFilho}
              className="w-full border-cream-line text-ink-soft hover:bg-cream"
            >
              {adicionando ? "Cadastrando..." : "Adicionar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
