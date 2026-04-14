(function initPromptwiseWidget() {
  if (document.getElementById('pw-root')) return;

  const fontStyleId = 'pw-font-faces';
  if (!document.getElementById(fontStyleId)) {
    const fontStyle = document.createElement('style');
    fontStyle.id = fontStyleId;
    fontStyle.textContent = `
      @font-face {
        font-family: "Black";
        src: url("${chrome.runtime.getURL('fonts/BeVietnamPro-Black.ttf')}") format("truetype");
      }

      @font-face {
        font-family: "boldFont";
        src: url("${chrome.runtime.getURL('fonts/BeVietnamPro-Bold.ttf')}") format("truetype");
      }

      @font-face {
        font-family: "extraLightFont";
        src: url("${chrome.runtime.getURL('fonts/BeVietnamPro-ExtraLight.ttf')}") format("truetype");
      }

      @font-face {
        font-family: "semibold";
        src: url("${chrome.runtime.getURL('fonts/BeVietnamPro-SemiBold.ttf')}") format("truetype");
      }
    `;
    document.head.appendChild(fontStyle);
  }

  const layoutChoices = [
    { key: 'small', label: 'Small' },
    { key: 'medium', label: 'Medium' },
    { key: 'large', label: 'Large' },
    { key: 'fullscreen', label: 'Fullscreen' },
    { key: 'sidebar', label: 'Sidebar' },
  ];

  const state = {
    activeLayout: 'fullscreen',
    autoImproving: false,
    autoInterceptEnabled: true,
    lastImprovedPrompt: '',
  };
  const PANEL_ANIMATION_MS = 180;

  const asset = (path) => chrome.runtime.getURL(path);

  function buildLayoutMenu(menuClass, optionClass) {
    return `
      <div class="${menuClass} pw-layout-menu pw-hidden" data-layout-menu>
        ${layoutChoices
          .map(
            ({ key, label }) =>
              `<button class="${optionClass} pw-layout-option" type="button" data-layout-option="${key}">${label}</button>`
          )
          .join('')}
      </div>
    `;
  }

  function buildHeader(config) {
    return `
      <div class="${config.headerClass}">
        <div class="${config.menuWrapClass}">
          <button class="${config.menuButtonClass} pw-icon-button" type="button" data-menu-toggle>
            <img class="${config.menuImageClass} pw-icon-image" src="${asset('graphics/layout.png')}" alt="Layout options" />
          </button>
          ${buildLayoutMenu(config.menuClass, config.optionClass)}
        </div>

        <div class="${config.switchWrapperClass}">
          <label class="${config.switchClass} pw-switch">
            <input type="checkbox" data-auto-toggle />
            <span class="${config.sliderClass} pw-switch-slider"></span>
          </label>

          <button class="${config.closeButtonClass} pw-icon-button" type="button" data-close>
            <img class="${config.closeImageClass} pw-icon-image" src="${asset('graphics/x.png')}" alt="Close" />
          </button>
        </div>
      </div>
    `;
  }

  const root = document.createElement('div');
  root.id = 'pw-root';
  root.innerHTML = `
    <button id="pw-launcher" class="mainButton pw-hit" type="button" aria-label="Open Promptwise">
      <img class="mainButtonPhoto" src="${asset('graphics/button.png')}" alt="button" />
    </button>

    <div class="overlay pw-hidden pw-hit" id="pw-overlay"></div>

    <!--fullscreen-->
    <section class="popup pw-panel pw-hidden pw-hit" id="pw-fullscreen" data-layout-panel="fullscreen">
      <div class="fullscreenLayout">
        ${buildHeader({
          headerClass: 'header',
          menuWrapClass: 'layoutMenuWrap',
          menuButtonClass: 'layoutButton',
          menuImageClass: 'layoutButtonPhoto',
          menuClass: 'layoutMiniPopup',
          optionClass: 'layoutOption',
          switchWrapperClass: 'fullscreenSwitchWrapper',
          switchClass: 'fullscreenSwitch',
          sliderClass: 'fullscreenSlider',
          closeButtonClass: 'x',
          closeImageClass: 'xPhoto',
        })}

        <div class="verticalLayout1">
          <div class="title2">Original Prompt</div>
          <div class="squareText pw-prompt-display" data-display="original">Paste your prompt here...</div>
        </div>

        <div class="bar"></div>

        <div class="verticalLayout">
          <div class="horizontalLayout">
            <div class="verticalLayout2">
              <div class="title2">Overall Rating</div>
              <div class="smallText6" data-display="feedback">Run analysis to get feedback.</div>
            </div>

            <div class="letterGrade" data-display="grade" data-tone="none">_</div>
          </div>

          <div class="horizontalLayout2">
            <div class="smallText">Clarity</div>
            <div class="smallText1" data-display="clarity">--/100</div>
          </div>
          <div class="wrapper">
            <div class="progressBar">
              <div class="progressBarFill pw-progress-fill" data-progress="clarity"></div>
            </div>
          </div>

          <div class="horizontalLayout3">
            <div class="smallText">Prompt Quality</div>
            <div class="smallText1" data-display="quality">--/100</div>
          </div>
          <div class="wrapper">
            <div class="progressBar">
              <div class="progressBarFill2 pw-progress-fill" data-progress="quality"></div>
            </div>
          </div>

          <div class="horizontalLayout3">
            <div class="smallText">Rewrite Readiness</div>
            <div class="smallText1" data-display="readiness">--/100</div>
          </div>
          <div class="wrapper">
            <div class="progressBar">
              <div class="progressBarFill3 pw-progress-fill" data-progress="readiness"></div>
            </div>
          </div>
        </div>

        <div class="bar2"></div>

        <div class="box">
          <div class="title2">Suggested Improvement</div>
          <div id="pw-output" class="squareText2 pw-prompt-display" data-display="rewritten">
            Improved prompt appears here...
          </div>

          <div class="wrapperButtons">
            <button id="pw-apply" class="apply" type="button">Apply</button>
            <button id="pw-copy" class="copy" type="button" aria-label="Copy improved prompt">
              <img class="copyPhoto" src="${asset('graphics/copy.png')}" alt="Copy" />
            </button>
          </div>
        </div>

        <div class="bar2"></div>

        <div class="wrapper3">
          <div class="horizontalLayout5">
            <div class="box2">
              <div class="title3">Gemini</div>
              <div class="smallText3">Description Here</div>

              <div class="horizontalLayout4">
                <div class="smallText4">Clarity</div>
                <div class="smallText4" data-display="score">--/100</div>
              </div>
              <div class="wrapper2">
                <div class="progressBar4 pw-card-track">
                  <div class="pw-card-fill pw-card-fill--light" data-progress="score"></div>
                </div>
              </div>
            </div>

            <div class="box3">
              <div class="title4">ChatGPT</div>
              <div class="smallText">Description Here</div>

              <div class="horizontalLayout4">
                <div class="smallText5">Clarity</div>
                <div class="smallText5" data-display="clarity">--/100</div>
              </div>
              <div class="wrapper2">
                <div class="progressBar3 pw-card-track">
                  <div class="pw-card-fill" data-progress="clarity"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="horizontalLayout5">
            <div class="box4">
              <div class="title4">Perplexity</div>
              <div class="smallText">Description Here</div>

              <div class="horizontalLayout4">
                <div class="smallText5">Clarity</div>
                <div class="smallText5" data-display="readiness">--/100</div>
              </div>
              <div class="wrapper2">
                <div class="progressBar3 pw-card-track">
                  <div class="pw-card-fill" data-progress="readiness"></div>
                </div>
              </div>
            </div>

            <div class="box3">
              <div class="title4">Claude</div>
              <div class="smallText">Description Here</div>

              <div class="horizontalLayout4">
                <div class="smallText5">Clarity</div>
                <div class="smallText5" data-display="quality">--/100</div>
              </div>
              <div class="wrapper2">
                <div class="progressBar3 pw-card-track">
                  <div class="pw-card-fill" data-progress="quality"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!--fullscreen-->

    <!--medium-->
    <section class="medium pw-panel pw-hidden pw-hit" id="pw-medium" data-layout-panel="medium">
      ${buildHeader({
        headerClass: 'mediumHeader',
        menuWrapClass: 'layoutMenuWrapMedium',
        menuButtonClass: 'layoutButtonMedium',
        menuImageClass: 'layoutButtonPhotoMedium',
        menuClass: 'layoutMiniPopupMedium',
        optionClass: 'layoutOptionMedium',
        switchWrapperClass: 'mediumSwitchWrapper',
        switchClass: 'mediumSwitch',
        sliderClass: 'mediumSlider',
        closeButtonClass: 'xMedium',
        closeImageClass: 'xPhotoMedium',
      })}

      <p class="Original">Original Prompt</p>
      <div class="horizontalWrapperMedium">
        <div class="firstbox pw-prompt-display" data-display="original">Paste your prompt here...</div>
        <div class="letterGradeMedium" data-display="grade" data-tone="none">_</div>
      </div>
      <div class="line"></div>
      <p class="Best">Best Prompt</p>
      <div class="secondbox pw-prompt-display" data-display="rewritten">Improved prompt appears here...</div>
    </section>
    <!--medium-->

    <!--small-->
    <section class="smallLayout pw-panel pw-hidden pw-hit" id="pw-small" data-layout-panel="small">
      ${buildHeader({
        headerClass: 'smallLayoutHeader',
        menuWrapClass: 'smallLayoutMenuWrap',
        menuButtonClass: 'smallLayoutButton',
        menuImageClass: 'smallLayoutButtonPhoto',
        menuClass: 'smallLayoutMiniPopup',
        optionClass: 'smallLayoutOption',
        switchWrapperClass: 'smallSwitchWrapper',
        switchClass: 'smallSwitch',
        sliderClass: 'smallSlider',
        closeButtonClass: 'smallLayoutClose',
        closeImageClass: 'smallLayoutClosePhoto',
      })}

      <p class="smallLayoutBest">Best Prompt</p>
      <div class="smallLayoutBox pw-prompt-display" data-display="rewritten">Improved prompt appears here...</div>
    </section>
    <!--small-->

    <!--large-->
    <section class="largeLayout pw-panel pw-hidden pw-hit" id="pw-large" data-layout-panel="large">
      ${buildHeader({
        headerClass: 'largeLayoutHeader',
        menuWrapClass: 'largeLayoutMenuWrap',
        menuButtonClass: 'largeLayoutButton',
        menuImageClass: 'largeLayoutButtonPhoto',
        menuClass: 'largeLayoutMiniPopup',
        optionClass: 'largeLayoutOption',
        switchWrapperClass: 'largeSwitchWrapper',
        switchClass: 'largeSwitch',
        sliderClass: 'largeSlider',
        closeButtonClass: 'largeLayoutClose',
        closeImageClass: 'largeLayoutClosePhoto',
      })}

      <div class="largeLayoutBody">
        <div class="largeLayoutLeftCol">
          <div>
            <p class="largeLayoutPromptLabel">Original Prompt</p>
            <div class="largeLayoutPromptBox pw-prompt-display" data-display="original">Paste your prompt here...</div>
          </div>
          <div>
            <p class="largeLayoutPromptLabel">Best Prompt</p>
            <div class="largeLayoutPromptBox pw-prompt-display" data-display="rewritten">Improved prompt appears here...</div>
          </div>
        </div>

        <div class="largeLayoutDivider"></div>

        <div class="largeLayoutRightCol">
          <div class="largeLayoutRatingRow">
            <div>
              <h2 class="largeLayoutRatingTitle">Overall Rating</h2>
              <div class="smallTextLarge" data-display="feedback">Run analysis to get feedback.</div>
            </div>
            <div class="largeLayoutGrade" data-display="grade" data-tone="none">_</div>
          </div>

          <div class="largeLayoutMetric">
            <div class="largeLayoutMetricHeader">
              <span class="largeLayoutMetricLabel">Clarity</span>
              <span class="largeLayoutMetricScore" data-display="clarity">--/100</span>
            </div>
            <div class="largeLayoutBarTrack">
              <div class="largeLayoutBarFill" data-progress="clarity"></div>
            </div>
          </div>

          <div class="largeLayoutMetric">
            <div class="largeLayoutMetricHeader">
              <span class="largeLayoutMetricLabel">Prompt Quality</span>
              <span class="largeLayoutMetricScore" data-display="quality">--/100</span>
            </div>
            <div class="largeLayoutBarTrack">
              <div class="largeLayoutBarFill" data-progress="quality"></div>
            </div>
          </div>

          <div class="largeLayoutMetric">
            <div class="largeLayoutMetricHeader">
              <span class="largeLayoutMetricLabel">Rewrite Readiness</span>
              <span class="largeLayoutMetricScore" data-display="readiness">--/100</span>
            </div>
            <div class="largeLayoutBarTrack">
              <div class="largeLayoutBarFill" data-progress="readiness"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!--large-->

    <!--sidebar-->
    <section class="sidebarLayout pw-panel pw-hidden pw-hit" id="pw-sidebar" data-layout-panel="sidebar">
      ${buildHeader({
        headerClass: 'sidebarLayoutHeader',
        menuWrapClass: 'sidebarLayoutMenuWrap',
        menuButtonClass: 'sidebarLayoutButton',
        menuImageClass: 'sidebarLayoutButtonPhoto',
        menuClass: 'sidebarLayoutMiniPopup',
        optionClass: 'sidebarLayoutOption',
        switchWrapperClass: 'sidebarSwitchWrapper',
        switchClass: 'sidebarSwitch',
        sliderClass: 'sidebarSlider',
        closeButtonClass: 'sidebarLayoutClose',
        closeImageClass: 'sidebarLayoutClosePhoto',
      })}

      <div class="sidebarTitle">Original Prompt</div>
      <div class="sidebarBox pw-prompt-display" data-display="original">Paste your prompt here...</div>

      <div class="sidebarTitle2">Best Prompt</div>
      <div class="sidebarBox pw-prompt-display" data-display="rewritten">Improved prompt appears here...</div>

      <div class="sidebarLine"></div>

      <div class="sidebarHorizontalLayout">
        <div class="sidebarVerticalLayout">
          <div class="sidebarTitle3">Overall Rating</div>
          <div class="sidebarP" data-display="feedback">Run analysis to get feedback.</div>
        </div>

        <div class="sidebarletterGrade" data-display="grade" data-tone="none">_</div>
      </div>

      <div class="ratingVertical">
        <div class="sidebarHorizontalLayout2">
          <div class="sidebarSmallTitle">Clarity</div>
          <div class="sidebarP2" data-display="clarity">--/100</div>
        </div>
        <div class="sidebarProgressBar">
          <div class="sidebarProgressFill" data-progress="clarity"></div>
        </div>
      </div>

      <div class="ratingVertical">
        <div class="sidebarHorizontalLayout2">
          <div class="sidebarSmallTitle">Prompt Quality</div>
          <div class="sidebarP2" data-display="quality">--/100</div>
        </div>
        <div class="sidebarProgressBar">
          <div class="sidebarProgressFill" data-progress="quality"></div>
        </div>
      </div>

      <div class="ratingVertical">
        <div class="sidebarHorizontalLayout2">
          <div class="sidebarSmallTitle">Rewrite Readiness</div>
          <div class="sidebarP2" data-display="readiness">--/100</div>
        </div>
        <div class="sidebarProgressBar">
          <div class="sidebarProgressFill" data-progress="readiness"></div>
        </div>
      </div>
    </section>
    <!--sidebar-->
  `;

  document.documentElement.appendChild(root);

  const launcher = root.querySelector('#pw-launcher');
  const overlay = root.querySelector('#pw-overlay');
  const output = root.querySelector('#pw-output');
  const apply = root.querySelector('#pw-apply');
  const copy = root.querySelector('#pw-copy');
  const panelMap = Object.fromEntries(
    Array.from(root.querySelectorAll('[data-layout-panel]')).map((panel) => [panel.dataset.layoutPanel, panel])
  );
  const autoToggles = Array.from(root.querySelectorAll('[data-auto-toggle]'));
  const layoutMenus = Array.from(root.querySelectorAll('[data-layout-menu]'));
  const originalDisplays = Array.from(root.querySelectorAll('[data-display="original"]'));
  const copyImage = copy.querySelector('.copyPhoto');
  const ORIGINAL_PLACEHOLDER = 'Paste your prompt here...';
  const WEBSITE_PROMPT_SELECTORS = [
    '#prompt-textarea',
    'textarea[data-id]',
    'form textarea',
    'main textarea',
    "div[contenteditable='true']",
  ];

  function getOutputValue() {
    return (output.textContent || '').trim();
  }

  function setOutputValue(value, fallback = 'Improved prompt appears here...') {
    output.textContent = value.trim() || fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function scoreToGrade(score) {
    if (!Number.isFinite(score)) return '_';
    if (score >= 9) return 'A';
    if (score >= 8) return 'B';
    if (score >= 7) return 'C';
    if (score >= 6) return 'D';
    return 'F';
  }

  function scoreToTone(score) {
    if (!Number.isFinite(score)) return 'none';
    if (score >= 9) return 'excellent';
    if (score >= 8) return 'good';
    if (score >= 7) return 'fair';
    if (score >= 6) return 'warning';
    return 'critical';
  }

  function setDisplay(role, text) {
    root.querySelectorAll(`[data-display="${role}"]`).forEach((element) => {
      element.textContent = text;
    });
  }

  function setProgress(role, value) {
    const safeValue = clamp(Number(value) || 0, 0, 100);
    root.querySelectorAll(`[data-progress="${role}"]`).forEach((element) => {
      element.style.width = `${safeValue}%`;
    });
  }

  function setGradeTone(tone) {
    root.querySelectorAll('[data-display="grade"]').forEach((element) => {
      element.dataset.tone = tone;
    });
  }

  function getOriginalPromptValue() {
    const activeDisplay = document.activeElement?.matches?.('[data-display="original"]')
      ? document.activeElement
      : null;
    const source = activeDisplay || originalDisplays[0];
    if (!source) return '';

    const value = (source.textContent || '').trim();
    return value === ORIGINAL_PLACEHOLDER ? '' : value;
  }

  function renderOriginalPrompt(value, fallback = ORIGINAL_PLACEHOLDER) {
    const safeValue = value.trim() || fallback;
    root.querySelectorAll('[data-display="original"]').forEach((element) => {
      if (element === document.activeElement) return;
      element.textContent = safeValue;
    });
  }

  function renderRewrittenPrompt(value, fallback = 'Improved prompt appears here...') {
    setDisplay('rewritten', value.trim() || fallback);
  }

  function setActionState(analyzing) {
    const hasOutput = Boolean(getOutputValue()) && getOutputValue() !== 'Improved prompt appears here...';
    apply.disabled = !hasOutput;
    copy.disabled = !hasOutput;
    copy.classList.toggle('copy--disabled', !hasOutput);
  }

  function resetMetrics() {
    setDisplay('grade', '_');
    setDisplay('score', '--/100');
    setDisplay('clarity', '--/100');
    setDisplay('quality', '--/100');
    setDisplay('readiness', '--/100');
    setDisplay('feedback', 'Run analysis to get feedback.');
    setGradeTone('none');
    setProgress('score', 0);
    setProgress('clarity', 0);
    setProgress('quality', 0);
    setProgress('readiness', 0);
  }

  function syncAutoToggleUi() {
    autoToggles.forEach((toggle) => {
      toggle.checked = state.autoInterceptEnabled;
    });

    setDisplay('auto-status', state.autoInterceptEnabled ? 'Enabled' : 'Disabled');
    setDisplay(
      'auto-detail',
      state.autoInterceptEnabled
        ? 'Promptwise will intercept send and replace the draft first.'
        : 'Send stays untouched until you run analysis manually.'
    );
    setProgress('auto', state.autoInterceptEnabled ? 100 : 0);
  }

  function hideMenus() {
    layoutMenus.forEach((menu) => menu.classList.add('pw-hidden'));
  }

  function showActivePanel() {
    Object.values(panelMap).forEach((panel) => {
      panel.classList.remove('pw-closing');
      panel.classList.add('pw-hidden');
    });
    (panelMap[state.activeLayout] || panelMap.fullscreen).classList.remove('pw-hidden');
  }

  function openPanel(layout = state.activeLayout) {
    state.activeLayout = layout;
    seedPromptFromComposer(false);
    syncAutoToggleUi();
    hideMenus();
    overlay.classList.remove('pw-closing');
    overlay.classList.remove('pw-hidden');
    showActivePanel();
  }

  function closePanel() {
    const activePanel = panelMap[state.activeLayout] || panelMap.fullscreen;
    overlay.classList.remove('pw-hidden');
    overlay.classList.add('pw-closing');
    activePanel.classList.add('pw-closing');
    hideMenus();

    window.setTimeout(() => {
      overlay.classList.remove('pw-closing');
      overlay.classList.add('pw-hidden');
      Object.values(panelMap).forEach((panel) => {
        panel.classList.remove('pw-closing');
        panel.classList.add('pw-hidden');
      });
    }, PANEL_ANIMATION_MS);
  }

  function getPromptComposer() {
    const textArea = document.querySelector(WEBSITE_PROMPT_SELECTORS.slice(0, 4).join(', '));
    if (textArea) {
      return {
        el: textArea,
        getValue: () => textArea.value || '',
        setValue: (value) => {
          textArea.value = value;
          textArea.dispatchEvent(new Event('input', { bubbles: true }));
        },
      };
    }

    const editable = document.querySelector(WEBSITE_PROMPT_SELECTORS[4]);
    if (editable) {
      return {
        el: editable,
        getValue: () => editable.innerText || '',
        setValue: (value) => {
          editable.focus();
          editable.textContent = value;
          editable.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              inputType: 'insertText',
              data: value,
            })
          );
        },
      };
    }

    return null;
  }

  function seedPromptFromComposer(force) {
    const composer = getPromptComposer();
    if (!composer) return;

    const value = composer.getValue().trim();
    if (!value) return;
    renderOriginalPrompt(value);
  }

  function applyAnalysis(parsed) {
    const rawScore = Number(parsed.score);
    const hasScore = Number.isFinite(rawScore);
    const safeScore = hasScore ? clamp(Math.round(rawScore), 1, 10) : NaN;
    const safeClarity = clamp(Math.round(Number(parsed.clarity) || 0), 0, 100);
    const quality = hasScore ? safeScore * 10 : 0;
    const readiness = hasScore ? Math.round((quality + safeClarity) / 2) : safeClarity;
    const feedback = typeof parsed.feedback === 'string' && parsed.feedback.trim()
      ? parsed.feedback.trim()
      : 'No feedback returned.';
    const rewrittenPrompt = typeof parsed.new_prompt === 'string' ? parsed.new_prompt.trim() : '';

    setDisplay('grade', scoreToGrade(safeScore));
    setDisplay('score', hasScore ? `${safeScore}/10` : '--/10');
    setDisplay('clarity', `${safeClarity}/100`);
    setDisplay('quality', hasScore ? `${quality}/100` : '--/100');
    setDisplay('readiness', `${readiness}/100`);
    setDisplay('feedback', feedback);
    setGradeTone(scoreToTone(safeScore));
    setProgress('score', quality);
    setProgress('clarity', safeClarity);
    setProgress('quality', quality);
    setProgress('readiness', readiness);

    setOutputValue(rewrittenPrompt);
    renderRewrittenPrompt(rewrittenPrompt);
    setActionState(false);

    return { rewrittenPrompt };
  }

  function showFeedback(message, forceFullscreen = false) {
    setDisplay('feedback', message);
    if (forceFullscreen) openPanel('fullscreen');
  }

  async function runAnalysis(prompt) {
    const response = await chrome.runtime.sendMessage({ type: 'ANALYZE_PROMPT', prompt });
    if (!response?.ok) throw new Error(response?.error || 'Analysis failed.');

    let parsed;
    try {
      parsed = JSON.parse(response.payload);
    } catch (error) {
      throw new Error('Could not parse model response as JSON.');
    }

    return applyAnalysis(parsed);
  }

  async function applyImprovedPrompt() {
    const rewrittenPrompt = getOutputValue();
    if (!rewrittenPrompt) return;

    const composer = getPromptComposer();
    if (!composer) {
      showFeedback('Open a supported prompt box first so Promptwise can apply the rewrite.', true);
      return;
    }

    composer.setValue(rewrittenPrompt);
    state.lastImprovedPrompt = rewrittenPrompt;
    showFeedback('Improved prompt applied to the page editor.', true);
  }

  async function analyzeFromChosenSource() {
    const composer = getPromptComposer();
    const websitePrompt = composer?.getValue().trim() || '';
    const prompt = state.autoInterceptEnabled ? websitePrompt : getOriginalPromptValue();
    if (!prompt) return;

    try {
      renderOriginalPrompt(prompt);
      setOutputValue('', 'Generating improved prompt...');
      renderRewrittenPrompt('', 'Generating improved prompt...');
      setActionState(true);
      showFeedback('Generating improved prompt...', true);

      const { rewrittenPrompt } = await runAnalysis(prompt);
      if (!rewrittenPrompt) throw new Error('No improved prompt returned.');
      showFeedback(
        state.autoInterceptEnabled
          ? 'Improved prompt generated from the website prompt box.'
          : 'Improved prompt generated from Promptwise input.',
        true
      );
    } catch (error) {
      setOutputValue('');
      renderRewrittenPrompt('');
      setActionState(false);
      showFeedback(error.message || 'Could not improve prompt.', true);
    }
  }

  async function interceptAndImprove(event) {
    if (!state.autoInterceptEnabled) return;

    const composer = getPromptComposer();
    if (!composer) return;

    const prompt = composer.getValue().trim();
    if (!prompt) return;

    if (state.autoImproving) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (state.lastImprovedPrompt && prompt === state.lastImprovedPrompt) {
      state.lastImprovedPrompt = '';
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    state.autoImproving = true;

    try {
      renderOriginalPrompt(prompt);
      setOutputValue('', 'Generating improved prompt...');
      renderRewrittenPrompt('', 'Generating improved prompt...');
      setActionState(true);
      showFeedback('Promptwise blocked send and is generating a better prompt...', true);

      const { rewrittenPrompt } = await runAnalysis(prompt);
      if (!rewrittenPrompt) throw new Error('No improved prompt returned.');

      composer.setValue(rewrittenPrompt);
      renderOriginalPrompt(rewrittenPrompt);
      state.lastImprovedPrompt = rewrittenPrompt;
      showFeedback('Prompt replaced with improved version. Press send again to continue.', true);
    } catch (error) {
      setOutputValue('');
      renderRewrittenPrompt('');
      setActionState(false);
      showFeedback(error.message || 'Could not improve prompt automatically.', true);
    } finally {
      state.autoImproving = false;
    }
  }

  resetMetrics();
  originalDisplays.forEach((element) => {
    element.setAttribute('contenteditable', 'plaintext-only');
    element.setAttribute('spellcheck', 'false');
    element.textContent = ORIGINAL_PLACEHOLDER;
  });
  renderOriginalPrompt('');
  renderRewrittenPrompt('');
  syncAutoToggleUi();
  setActionState(false);

  originalDisplays.forEach((element) => {
    element.addEventListener('focus', () => {
      if ((element.textContent || '').trim() === ORIGINAL_PLACEHOLDER) {
        element.textContent = '';
      }
    });

    element.addEventListener('blur', () => {
      const typedPrompt = (element.textContent || '').trim();
      renderOriginalPrompt(typedPrompt);
    });

    element.addEventListener('input', () => {
      const typedPrompt = (element.textContent || '').trim();
      renderOriginalPrompt(typedPrompt);
    });

    element.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      analyzeFromChosenSource();
    });
  });

  launcher.addEventListener('click', () => openPanel());
  overlay.addEventListener('click', closePanel);

  root.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', closePanel);
  });

  root.querySelectorAll('[data-menu-toggle]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const menu = button.parentElement?.querySelector('[data-layout-menu]');
      if (!menu) return;
      const shouldOpen = menu.classList.contains('pw-hidden');
      hideMenus();
      if (shouldOpen) menu.classList.remove('pw-hidden');
    });
  });

  root.querySelectorAll('[data-layout-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextLayout = button.getAttribute('data-layout-option');
      if (!nextLayout || !panelMap[nextLayout]) return;
      state.activeLayout = nextLayout;
      if (!overlay.classList.contains('pw-hidden')) showActivePanel();
      hideMenus();
    });
  });

  autoToggles.forEach((toggle) => {
    toggle.addEventListener('change', (event) => {
      state.autoInterceptEnabled = event.currentTarget.checked;
      syncAutoToggleUi();
    });
  });

  apply.addEventListener('click', applyImprovedPrompt);

  copy.addEventListener('click', async () => {
    const rewrittenPrompt = getOutputValue();
    if (!rewrittenPrompt) return;

    await navigator.clipboard.writeText(rewrittenPrompt);
    copy.classList.add('copy--done');
    copyImage.alt = 'Copied';
    setTimeout(() => {
      copy.classList.remove('copy--done');
      copyImage.alt = 'Copy';
    }, 900);
  });

  document.addEventListener(
    'input',
    (event) => {
      if (!state.autoInterceptEnabled) return;
      const composer = getPromptComposer();
      if (!composer) return;
      if (event.target !== composer.el && !composer.el.contains?.(event.target)) return;
      const websitePrompt = composer.getValue().trim();
      renderOriginalPrompt(websitePrompt);
    },
    true
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && !overlay.classList.contains('pw-hidden')) {
        closePanel();
        return;
      }

      if (event.key !== 'Enter' || event.shiftKey) return;

      const composer = getPromptComposer();
      if (!composer) return;
      if (composer.el !== event.target && !composer.el.contains?.(event.target)) return;
      interceptAndImprove(event);
    },
    true
  );

  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.querySelector('#prompt-textarea, textarea, div[contenteditable="true"]')) return;
      interceptAndImprove(event);
    },
    true
  );

  document.addEventListener(
    'click',
    (event) => {
      const clickedElement = event.target instanceof Element ? event.target : null;
      const clickedMenuUi = clickedElement?.closest('[data-menu-toggle], [data-layout-menu]');

      if (!clickedMenuUi) {
        hideMenus();
      }

      if (clickedElement && !root.contains(clickedElement)) {
        hideMenus();
      }

      const target = clickedElement?.closest('button') || null;
      if (!target) return;

      const attrLabel = (target.getAttribute('aria-label') || '').toLowerCase();
      const dataTestId = (target.getAttribute('data-testid') || '').toLowerCase();
      const text = (target.textContent || '').trim().toLowerCase();

      const looksLikeSend =
        attrLabel.includes('send') ||
        dataTestId.includes('send') ||
        text === 'send' ||
        text === '↵';

      if (looksLikeSend) {
        interceptAndImprove(event);
      }
    },
    true
  );
})();
