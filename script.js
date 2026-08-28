// ================================
// FIREBASE
// ================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    setDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCI52sj6BznA_PPZpiR_Zx0RQoAHeMA6k4",
    authDomain: "agenda-sacramental-sao-luis.firebaseapp.com",
    projectId: "agenda-sacramental-sao-luis",
    storageBucket: "agenda-sacramental-sao-luis.firebasestorage.app",
    messagingSenderId: "381811103303",
    appId: "1:381811103303:web:d537622350a300db7f0362"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION = "reunioes";

// TESTE DE CONEXÃO

const statusEl = document.getElementById('conn-status');

getDocs(query(collection(db, COLLECTION), limit(1)))
    .then(() => {
        statusEl.textContent = 'Conectado — dados salvos no Firebase';
        statusEl.className = 'rs-status online';
    })
    .catch((err) => {
        statusEl.textContent = 'Erro de conexão: ' + err.message;
        statusEl.className = 'rs-status offline';
        console.error(err);
    });

(function() {
    const discursoLabels = [
        "Primeiro Discursante",
        "Segundo Discursante",
        "Terceiro Discursante"
    ];

    const wrapDiscursos = document.getElementById('f-discursos');

    discursoLabels.forEach((label, i) => {
        const row = document.createElement('div');
        row.className = 'rs-discurso-row';

        row.innerHTML =
            '<div class="rs-discurso-num">' + (i + 1) + '</div>' +
            '<input type="text" class="f-discurso" data-idx="' + i + '" placeholder="' + label + '" />';

        wrapDiscursos.appendChild(row);

        // Hino intermediário entre o segundo e o terceiro discursante
        if (i === 1) {
            const hino = document.createElement('div');
            hino.className = 'rs-field';
            hino.innerHTML =
                '<label>Hino intermediário:</label>' +
                '<input type="text" id="f-hino-intermediario" placeholder="Nº e nome do hino" />';

            wrapDiscursos.appendChild(hino);
        }
    });

    // ================================
    // TIPO DE REUNIÃO
    // ================================

    const blocoDiscursos = document.getElementById('bloco-discursos');
    const blocoTestemunhos = document.getElementById('bloco-testemunhos');

    function getTipoReuniao() {
        return document.querySelector('input[name="tipo-reuniao"]:checked').value;
    }

    function atualizarTipoReuniao() {
        const tipo = getTipoReuniao();

        if (tipo === 'testemunho') {
            blocoDiscursos.style.display = 'none';
            blocoTestemunhos.style.display = '';
        } else {
            blocoDiscursos.style.display = '';
            blocoTestemunhos.style.display = 'none';
        }
    }

    document.querySelectorAll('input[name="tipo-reuniao"]').forEach(radio => {
        radio.addEventListener('change', atualizarTipoReuniao);
    });

    atualizarTipoReuniao();

    const tabs = document.querySelectorAll('.rs-tab');
    const viewForm = document.getElementById('rs-view-form');
    const viewHistory = document.getElementById('rs-view-history');
    tabs.forEach(t => t.addEventListener('click', () => {
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        if (t.dataset.tab === 'form') {
            viewForm.style.display = '';
            viewHistory.style.display = 'none';
        } else {
            viewForm.style.display = 'none';
            viewHistory.style.display = '';
            loadHistory();
        }
    }));

    function todayISO() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    document.getElementById('f-date').value = todayISO();

    function collectForm() {
        const tipo = getTipoReuniao();

        return {
            date: document.getElementById('f-date').value,
            tipoReuniao: tipo,

            // INFORMAÇÕES DA REUNIÃO
            dirigidoPor: document.getElementById('f-dirigido').value.trim(),
            presididoPor: document.getElementById('f-presidido').value.trim(),

            // PRELÚDIO
            pianista: document.getElementById('f-pianista').value.trim(),
            regente: document.getElementById('f-regente').value.trim(),

            // ABERTURA
            reconhecimentos: document.getElementById('f-reconhecimentos').value.trim(),
            anuncios: document.getElementById('f-anuncios').value.trim(),
            hinoAbertura: document.getElementById('f-hino-abertura').value.trim(),
            oracaoAbertura: document.getElementById('f-oracao-abertura').value.trim(),

            // ASSUNTOS DA ALA E DA ESTACA
            chamados: document.getElementById('f-chamados').value.trim(),
            criancas: document.getElementById('f-criancas').value.trim(),
            confirmacoes: document.getElementById('f-confirmacoes').value.trim(),
            tempoEstaca: document.getElementById('f-tempo-estaca').value.trim(),

            // SACRAMENTO
            hinoSacramental: document.getElementById('f-hino-sacramental').value.trim(),

            // MENSAGENS / TESTEMUNHOS
            discursos: tipo === 'normal'
                ? Array.from(document.querySelectorAll('.f-discurso'))
                    .map(el => el.value.trim())
                : [],

            hinoIntermediario: tipo === 'normal'
                ? document.getElementById('f-hino-intermediario').value.trim()
                : '',

            testemunhos: tipo === 'testemunho'
                ? document.getElementById('f-testemunhos').value.trim()
                : '',

            // ENCERRAMENTO
            hinoEncerramento: document.getElementById('f-hino-encerramento').value.trim(),
            oracaoEncerramento: document.getElementById('f-oracao-encerramento').value.trim()
        };
    }

    function fillForm(entry) {
        document.getElementById('f-date').value = entry.date || todayISO();

        const tipo = entry.tipoReuniao || 'normal';

        document.querySelector(
            'input[name="tipo-reuniao"][value="' + tipo + '"]'
        ).checked = true;

        atualizarTipoReuniao();

        // INFORMAÇÕES DA REUNIÃO
        document.getElementById('f-dirigido').value =
            entry.dirigidoPor || '';
        document.getElementById('f-presidido').value =
            entry.presididoPor || '';

        // PRELÚDIO
        document.getElementById('f-pianista').value =
            entry.pianista || '';
        document.getElementById('f-regente').value =
            entry.regente || '';

        // ABERTURA
        document.getElementById('f-reconhecimentos').value =
            entry.reconhecimentos || '';
        document.getElementById('f-anuncios').value =
            entry.anuncios || '';
        document.getElementById('f-hino-abertura').value =
            entry.hinoAbertura || '';
        document.getElementById('f-oracao-abertura').value =
            entry.oracaoAbertura || '';

        // ASSUNTOS DA ALA E DA ESTACA
        document.getElementById('f-chamados').value =
            entry.chamados || '';
        document.getElementById('f-criancas').value =
            entry.criancas || '';
        document.getElementById('f-confirmacoes').value =
            entry.confirmacoes || '';
        document.getElementById('f-tempo-estaca').value =
            entry.tempoEstaca || '';

        // SACRAMENTO
        document.getElementById('f-hino-sacramental').value =
            entry.hinoSacramental || '';

        // MENSAGENS
        const discursoEls = document.querySelectorAll('.f-discurso');

        discursoEls.forEach((el, i) => {
            el.value = (entry.discursos && entry.discursos[i]) || '';
        });

        document.getElementById('f-hino-intermediario').value =
            entry.hinoIntermediario || '';

        // TESTEMUNHOS
        document.getElementById('f-testemunhos').value =
            entry.testemunhos || '';

        // ENCERRAMENTO
        document.getElementById('f-hino-encerramento').value =
            entry.hinoEncerramento || '';

        document.getElementById('f-oracao-encerramento').value =
            entry.oracaoEncerramento || '';
    }

    function clearForm() {
        fillForm({
            date: todayISO()
        });
    }
    document.getElementById('btn-clear').addEventListener('click', clearForm);

    function showMsg(text, ok) {
        const el = document.getElementById('f-msg');
        el.textContent = text;
        el.className = 'rs-msg ' + (ok ? 'ok' : 'err');
        setTimeout(() => {
            el.className = 'rs-msg';
        }, 3500);
    }

    function formatDate(iso) {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return d + '/' + m + '/' + y;
    }

    // ================================
    // ORIENTAÇÃO — CHAMADOS E DESOBRIGAÇÕES
    // ================================

    const btnOrientacao = document.getElementById('btn-orientacao');
    const orientacaoChamados = document.getElementById('orientacao-chamados');

    btnOrientacao.addEventListener('click', () => {
        const aberta = orientacaoChamados.style.display !== 'none';

        if (aberta) {
            orientacaoChamados.style.display = 'none';
            btnOrientacao.textContent = '📌 Ver padrão para chamados e desobrigações';
        } else {
            orientacaoChamados.style.display = '';
            btnOrientacao.textContent = '📌 Ocultar padrão';
        }
    });

    document.getElementById('btn-save').addEventListener('click', async () => {
        const entry = collectForm();
        if (!entry.date) {
            showMsg('Informe a data da reunião antes de salvar.', false);
            return;
        }
        const btn = document.getElementById('btn-save');
        btn.disabled = true;
        try {
            await setDoc(doc(db, COLLECTION, entry.date), entry);
            showMsg('Reunião de ' + formatDate(entry.date) + ' salva no histórico.', true);
            clearForm();
        } catch (err) {
            showMsg('Erro ao salvar: ' + err.message, false);
        } finally {
            btn.disabled = false;
        }
    });

    async function loadHistory() {
        const listEl = document.getElementById('hist-list');
        listEl.innerHTML = '<div class="rs-loading">Carregando histórico…</div>';
        try {
            const q = query(
                collection(db, COLLECTION),
                orderBy('date', 'desc')
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                listEl.innerHTML = '<div class="rs-hist-empty">Nenhuma reunião salva ainda.<br/>Preencha o formulário e clique em "Salvar reunião".</div>';
                return;
            }
            const entries = [];
            snapshot.forEach(doc => entries.push(doc.data()));
            renderHistory(entries);
        } catch (err) {
            listEl.innerHTML = '<div class="rs-hist-empty">Erro ao carregar histórico: ' + err.message + '</div>';
        }
    }

    function fieldRow(label, value) {
        if (!value) return '';
        return '<div class="rs-hist-row"><div class="rs-hist-label">' + label + '</div><div class="rs-hist-val">' + escapeHtml(value) + '</div></div>';
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        } [c]));
    }

    function gerarPDF(entry) {

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const margem = 18;
        const largura = 174;
        const alturaPagina = 297;

        // Área segura para o conteúdo.
        // O rodapé ficará abaixo desta área.
        const inicioConteudo = 17;
        const limiteConteudo = 300;

        const rodapeY = 290;

        const isTestemunho =
            entry.tipoReuniao === "testemunho";

        // ============================================================
        // MONTAR LISTA DE CONTEÚDO
        // ============================================================

        const blocos = [];

        function adicionarSecao(texto) {
            blocos.push({
                tipo: "secao",
                texto: texto
            });
        }

        function adicionarCampo(label, valor) {
            if (!valor) return;

            blocos.push({
                tipo: "campo",
                label: label,
                valor: String(valor)
            });
        }

        // ============================================================
        // CONTEÚDO — MESMA ORDEM DA AGENDA
        // ============================================================

        adicionarSecao("Informações da Reunião");

        adicionarCampo(
            "Data",
            formatDate(entry.date)
        );

        adicionarCampo(
            "Dirigido por",
            entry.dirigidoPor
        );

        adicionarCampo(
            "Presidido por",
            entry.presididoPor
        );

        adicionarSecao("Música");

        adicionarCampo(
            "Pianista",
            entry.pianista
        );

        adicionarCampo(
            "Regente",
            entry.regente
        );

        adicionarSecao("Abertura");

        adicionarCampo(
            "Reconhecimentos",
            entry.reconhecimentos
        );

        adicionarCampo(
            "Anúncios",
            entry.anuncios
        );

        adicionarCampo(
            "Hino de abertura",
            entry.hinoAbertura
        );

        adicionarCampo(
            "Oração de abertura",
            entry.oracaoAbertura
        );

        adicionarSecao("Assuntos da Ala e da Estaca");

        adicionarCampo(
            "Chamados e Desobrigações",
            entry.chamados
        );

        adicionarCampo(
            "Abençoar e Dar Nome a Crianças",
            entry.criancas
        );

        adicionarCampo(
            "Confirmação de Novos Conversos",
            entry.confirmacoes
        );

        adicionarCampo(
            "Tempo para Estaca",
            entry.tempoEstaca
        );

        adicionarSecao("Sacramento");

        adicionarCampo(
            "Hino sacramental",
            entry.hinoSacramental
        );

        if (isTestemunho) {

            adicionarSecao("Testemunhos");

            adicionarCampo(
                "Membros que prestaram testemunho",
                entry.testemunhos
            );

        } else {

            adicionarSecao("Mensagens do Evangelho");

            const discursos =
                entry.discursos || [];

            adicionarCampo(
                "Primeiro discursante",
                discursos[0]
            );

            adicionarCampo(
                "Segundo discursante",
                discursos[1]
            );

            adicionarCampo(
                "Hino intermediário",
                entry.hinoIntermediario
            );

            adicionarCampo(
                "Terceiro discursante",
                discursos[2]
            );
        }

        adicionarSecao("Encerramento");

        adicionarCampo(
            "Hino de encerramento",
            entry.hinoEncerramento
        );

        adicionarCampo(
            "Oração de encerramento",
            entry.oracaoEncerramento
        );

        // ============================================================
        // CALCULAR ALTURA NECESSÁRIA
        // ============================================================

        function calcularAltura(escala) {

            let altura = 0;

            // Cabeçalho
            altura += 7;
            altura += 6;
            altura += 6;
            altura += 8;
            altura += 7;

            blocos.forEach(bloco => {

                if (bloco.tipo === "secao") {

                    altura += 4 * escala;
                    altura += 6 * escala;

                } else {

                    pdf.setFont(
                        "helvetica",
                        "normal"
                    );

                    pdf.setFontSize(
                        9.5 * escala
                    );

                    const linhas =
                        pdf.splitTextToSize(
                            bloco.valor,
                            largura
                        );

                    altura +=
                        3.7 * escala +
                        linhas.length * 3.9 * escala +
                        2.2 * escala;
                }
            });

            return altura;
        }

        // ============================================================
        // ENCONTRAR O MELHOR TAMANHO
        // ============================================================

        let escala = 1;

        const escalas = [
            1,
            0.95,
            0.90,
            0.85,
            0.80,
            0.75,
            0.70,
            0.65
        ];

        for (let i = 0; i < escalas.length; i++) {

            const teste =
                calcularAltura(escalas[i]);

            if (teste <= limiteConteudo - inicioConteudo) {
                escala = escalas[i];
                break;
            }

            // Caso ainda não caiba,
            // usa a menor escala disponível.
            escala = escalas[escalas.length - 1];
        }

        // ============================================================
        // POSIÇÃO INICIAL
        // ============================================================

        let y = inicioConteudo;

        // ============================================================
        // CABEÇALHO
        // ============================================================

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.setFontSize(18);

        pdf.setTextColor(
            31,
            58,
            95
        );

        pdf.text(
            "Ala Jd. São Luís · Santo Amaro",
            margem,
            y
        );

        y += 7;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.setFontSize(11);

        pdf.setTextColor(
            170,
            170,
            170
        );

        pdf.text(
            isTestemunho
                ? "Reunião de Testemunho"
                : "Reunião Sacramental",
            margem,
            y
        );

        y += 6;

        // ============================================================
        // LINHA DOURADA
        // ============================================================

        pdf.setDrawColor(
            184,
            146,
            63
        );

        pdf.setLineWidth(0.7);

        pdf.line(
            margem,
            y,
            192,
            y
        );

        y += 8;

        // ============================================================
        // TÍTULO
        // ============================================================

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.setFontSize(14);

        pdf.setTextColor(
            31,
            58,
            95
        );

        pdf.text(
            isTestemunho
                ? "Ata da Reunião de Testemunho"
                : "Ata da Reunião Sacramental",
            margem,
            y
        );

        y += 7;

        // ============================================================
        // RENDERIZAR SEÇÕES
        // ============================================================

        function renderSecao(texto) {

            y += 4 * escala;

            pdf.setFont(
                "helvetica",
                "bold"
            );

            pdf.setFontSize(
                12 * escala
            );

            pdf.setTextColor(
                31,
                58,
                95
            );

            pdf.text(
                texto,
                margem,
                y
            );

            y += 6 * escala;
        }

        // ============================================================
        // RENDERIZAR CAMPOS
        // ============================================================

        function renderCampo(label, valor) {

            if (!valor) return;

            pdf.setFont(
                "helvetica",
                "normal"
            );

            pdf.setFontSize(
                9.5 * escala
            );

            const linhas =
                pdf.splitTextToSize(
                    String(valor),
                    largura
                );

            pdf.setFont(
                "helvetica",
                "bold"
            );

            pdf.setFontSize(
                8.5 * escala
            );

            pdf.setTextColor(
                107,
                104,
                95
            );

            pdf.text(
                label,
                margem,
                y
            );

            y += 3.7 * escala;

            pdf.setFont(
                "helvetica",
                "normal"
            );

            pdf.setFontSize(
                9.5 * escala
            );

            pdf.setTextColor(
                20,
                20,
                20
            );

            pdf.text(
                linhas,
                margem,
                y
            );

            y +=
                linhas.length *
                3.9 *
                escala;

            y +=
                2.2 *
                escala;
        }

        // ============================================================
        // RENDERIZAR TODO O CONTEÚDO
        // ============================================================

        blocos.forEach(bloco => {

            if (bloco.tipo === "secao") {

                renderSecao(
                    bloco.texto
                );

            } else {

                renderCampo(
                    bloco.label,
                    bloco.valor
                );
            }
        });

        // ============================================================
        // RODAPÉ
        // ============================================================

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
            107,
            104,
            95
        );

        pdf.text(
            "Agenda Sacramental · Ala Jd. São Luís · Santo Amaro",
            margem,
            rodapeY
        );

        pdf.text(
            "Página 1 de 1",
            192,
            rodapeY,
            {
                align: "right"
            }
        );

        // ============================================================
        // SALVAR
        // ============================================================

        pdf.save(
            "ata-reuniao-sacramental-" +
            entry.date +
            ".pdf"
        );
    }

    function renderHistory(entries) {
        const listEl = document.getElementById('hist-list');
        listEl.innerHTML = '';
        entries.forEach(entry => {
            const card = document.createElement('div');
            card.className = 'rs-hist-card';
            const isTestemunho = entry.tipoReuniao === 'testemunho';
            card.innerHTML =
                '<div class="rs-hist-head">' +
                '<div>' +
                '<div class="rs-hist-date">' + formatDate(entry.date) + '</div>' +
                '<div class="rs-hist-sub">' +
                (isTestemunho
                    ? 'Reunião de Testemunho'
                    : 'Reunião Sacramental') +
                '</div>' +
                '</div>' +
                '<div class="rs-hist-chevron">&#9662;</div>' +
                '</div>' +

                '<div class="rs-hist-body">' +

                // INFORMAÇÕES
                fieldRow(
                    'Tipo de reunião',
                    isTestemunho
                        ? 'Reunião de Testemunho'
                        : 'Reunião Sacramental'
                ) +

                fieldRow('Data', formatDate(entry.date)) +
                fieldRow('Dirigido por', entry.dirigidoPor) +
                fieldRow('Presidido por', entry.presididoPor) +

                // PRELÚDIO
                fieldRow('Pianista', entry.pianista) +
                fieldRow('Regente', entry.regente) +

                // ABERTURA
                fieldRow('Reconhecimentos', entry.reconhecimentos) +
                fieldRow('Anúncios', entry.anuncios) +
                fieldRow('Hino de abertura', entry.hinoAbertura) +
                fieldRow('Oração de abertura', entry.oracaoAbertura) +

                // ASSUNTOS DA ALA E DA ESTACA
                fieldRow('Chamados e Desobrigações', entry.chamados) +
                fieldRow(
                    'Abençoar e Dar Nome a Crianças',
                    entry.criancas
                ) +
                fieldRow(
                    'Confirmação de Novos Conversos',
                    entry.confirmacoes
                ) +
                fieldRow('Tempo para Estaca', entry.tempoEstaca) +

                // SACRAMENTO
                fieldRow('Hino sacramental', entry.hinoSacramental) +

                // MENSAGENS / TESTEMUNHOS
                (isTestemunho
                    ? fieldRow('Testemunhos', entry.testemunhos)
                    : fieldRow(
                          'Primeiro discursante',
                          entry.discursos && entry.discursos[0]
                      ) +
                      fieldRow(
                          'Segundo discursante',
                          entry.discursos && entry.discursos[1]
                      ) +
                      fieldRow(
                          'Hino intermediário',
                          entry.hinoIntermediario
                      ) +
                      fieldRow(
                          'Terceiro discursante',
                          entry.discursos && entry.discursos[2]
                      )) +

                // ENCERRAMENTO
                fieldRow(
                    'Hino de encerramento',
                    entry.hinoEncerramento
                ) +

                fieldRow(
                    'Oração de encerramento',
                    entry.oracaoEncerramento
                ) +

                '<div class="rs-hist-actions">' +
                '<button class="btn-edit">Editar</button>' +
                '<button class="btn-pdf">Baixar PDF</button>' +
                '<button class="btn-delete danger">Excluir</button>' +
                '</div>' +
                '</div>';

            const head = card.querySelector('.rs-hist-head');
            const body = card.querySelector('.rs-hist-body');
            const chevron = card.querySelector('.rs-hist-chevron');
            head.addEventListener('click', () => {
                const open = body.classList.toggle('open');
                chevron.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
            });

            card.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                fillForm(entry);
                document.querySelector('.rs-tab[data-tab="form"]').click();
                showMsg('Reunião de ' + formatDate(entry.date) + ' carregada para edição.', true);
            });

            card.querySelector('.btn-pdf').addEventListener('click', (e) => {
                e.stopPropagation();
                gerarPDF(entry);
            });

            card.querySelector('.btn-delete').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm('Excluir a reunião de ' + formatDate(entry.date) + ' do histórico?')) return;
                try {
                    await deleteDoc(doc(db, COLLECTION, entry.date));
                    loadHistory();
                } catch (err) {
                    alert('Erro ao excluir: ' + err.message);
                }
            });

            listEl.appendChild(card);
        });
    }
})();