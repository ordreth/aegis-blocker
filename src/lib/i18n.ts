const TEST_LOCALES: Record<string, Record<string, { message: string }>> = {
  en: {
    appName: { message: "Aegis Blocker" },
    appDesc: {
      message:
        "Absolute focus shield. Block distractions with mythological strength.",
    },
    status_locked: { message: "Aegis Locked" },
    status_active: { message: "Aegis Blocker" },
    header_desc_locked: { message: "Active Absolute Mode. Releases in:" },
    header_desc_normal: { message: "Manage your restrictions." },
    btn_lock: { message: "Lock Shield" },
    btn_cancel: { message: "Cancel" },
    tooltip_unlocks_in: { message: "Unlocks in" },
    absolute_mode_active: { message: "Absolute Mode Active" },
    modal_title: { message: "Activate Absolute Mode?" },
    modal_description_styled: {
      message:
        "By activating this mode, you {text-foreground:will not be able to remove} any existing rules for the next {text-foreground:24 hours}.\n\nYou can still add new rules, but nothing can be undone until the time runs out.\n\nAre you sure you want to make this commitment?",
    },
    modal_confirm: { message: "Yes, Lock the Shield" },
    btn_activate_absolute_mode_tooltip: { message: "Activate Absolute Mode" },
    btn_export_backup: { message: "Export Backup" },
    btn_import_backup: { message: "Import Backup" },
    btn_expand_options: { message: "Expand" },
    btn_quick_block_template: { message: "Block {domain} now" },
    input_placeholder_example: { message: "Ex: reddit.com/r/memes" },
    btn_add: { message: "Add" },
    table_header_url: { message: "URL pattern" },
    table_header_action: { message: "Action" },
    empty_state_title: { message: "No active rules." },
    empty_state_desc: {
      message: "Your browsing is now completely unrestricted.",
    },
    btn_remove: { message: "Remove" },
    aria_remove_rule: { message: "Remove rule for {pattern}" },
    alert_invalid_pattern: {
      message: "For security reasons, the pattern must match a URL structure.",
    },
    alert_action_blocked: { message: "Action blocked by Absolute Mode." },
    alert_import_success: { message: "Backup imported successfully!" },
    alert_import_error: {
      message: "Error importing file. Check if the JSON is valid.",
    },
    btn_open_settings: { message: "Settings" },
    settings_title: { message: "Settings" },
    settings_subtitle: { message: "Customize your Aegis experience" },
    loading_settings: { message: "Loading settings..." },

    tab_general: { message: "General" },
    tab_appearance: { message: "Appearance & Language" },
    tab_security: { message: "Security (Absolute Mode)" },

    general_behavior_title: { message: "Behavior" },
    general_behavior_desc: {
      message: "How Aegis handles rules and interactions.",
    },
    setting_double_check: { message: "Double-check deletion" },
    setting_double_check_desc: {
      message: "Ask for confirmation before removing a rule.",
    },

    appearance_interface_title: { message: "Interface" },
    appearance_interface_desc: {
      message: "Make Aegis look and speak the way you want.",
    },
    setting_theme: { message: "Theme" },
    setting_theme_placeholder: { message: "Select theme" },
    theme_system: { message: "System Default" },
    theme_dark: { message: "Dark (Midnight)" },
    theme_light: { message: "Light" },
    setting_language: { message: "Language" },
    setting_language_placeholder: { message: "Select language" },
    setting_language_note: {
      message: "Note: Changing language will reload the extension.",
    },

    security_config_title: { message: "Absolute Mode Configuration" },
    security_config_desc: { message: "Customize the intensity of the lock." },
    security_lock_duration: { message: "Lock Duration" },
    security_duration_note: {
      message: "Adjustable duration coming soon. Currently fixed at 24h.",
    },
    security_require_password: { message: "Require Password" },
    security_password_desc: {
      message: "Require a password to unlock or remove rules.",
    },

    modal_delete_title: { message: "Delete Rule?" },
    modal_delete_desc: {
      message:
        "This action cannot be undone immediately if you change your mind later.",
    },
    btn_confirm_delete: { message: "Delete" },
  },

  pt: {
    appName: { message: "Aegis Bloqueador" },
    appDesc: {
      message:
        "Escudo de foco absoluto. Bloqueie distrações com força mitológica.",
    },
    status_locked: { message: "Aegis Travado" },
    status_active: { message: "Aegis Bloqueador" },
    header_desc_locked: { message: "Modo Absoluto Ativo. Libera em:" },
    header_desc_normal: { message: "Gerencie suas restrições." },
    btn_lock: { message: "Travar Escudo" },
    btn_cancel: { message: "Cancelar" },
    tooltip_unlocks_in: { message: "Libera em" },
    absolute_mode_active: { message: "Modo Absoluto Ativo" },
    modal_title: { message: "Ativar Modo Absoluto?" },
    modal_description_styled: {
      message:
        "Ao ativar este modo, você {text-foreground:não poderá remover} nenhuma regra existente pelas próximas {text-foreground:24 horas}.\n\nVocê ainda poderá adicionar novas regras, mas nada poderá ser desfeito até o tempo acabar.\n\nTem certeza que deseja assumir este compromisso?",
    },
    modal_confirm: { message: "Sim, Travar o Escudo" },
    btn_activate_absolute_mode_tooltip: { message: "Ativar Modo Absoluto" },
    btn_export_backup: { message: "Exportar Backup" },
    btn_import_backup: { message: "Importar Backup" },
    btn_expand_options: { message: "Expandir" },
    btn_quick_block_template: { message: "Bloquear {domain} agora" },
    input_placeholder_example: { message: "Ex: reddit.com/r/memes" },
    btn_add: { message: "Adicionar" },
    table_header_url: { message: "Padrão da URL" },
    table_header_action: { message: "Ação" },
    empty_state_title: { message: "Nenhuma regra ativa." },
    empty_state_desc: {
      message: "Sua navegação está completamente irrestrita.",
    },
    btn_remove: { message: "Remover" },
    aria_remove_rule: { message: "Remover regra para {pattern}" },
    alert_invalid_pattern: {
      message:
        "Por motivos de segurança, o padrão deve corresponder à estrutura de uma URL.",
    },
    alert_action_blocked: { message: "Ação bloqueada pelo Modo Absoluto." },
    alert_import_success: { message: "Backup importado com sucesso!" },
    alert_import_error: {
      message: "Erro ao importar arquivo. Verifique se o JSON é válido.",
    },
    btn_open_settings: { message: "Configurações" },
    settings_title: { message: "Configurações" },
    settings_subtitle: { message: "Personalize sua experiência com o Aegis" },
    loading_settings: { message: "Carregando configurações..." },

    tab_general: { message: "Geral" },
    tab_appearance: { message: "Aparência e Idioma" },
    tab_security: { message: "Segurança (Modo Absoluto)" },

    general_behavior_title: { message: "Comportamento" },
    general_behavior_desc: {
      message: "Como o Aegis lida com regras e interações.",
    },
    setting_double_check: { message: "Confirmar remoção" },
    setting_double_check_desc: {
      message: "Solicitar confirmação antes de remover uma regra.",
    },

    appearance_interface_title: { message: "Interface" },
    appearance_interface_desc: {
      message: "Faça o Aegis parecer e falar do jeito que você quiser.",
    },
    setting_theme: { message: "Tema" },
    setting_theme_placeholder: { message: "Selecionar tema" },
    theme_system: { message: "Padrão do Sistema" },
    theme_dark: { message: "Escuro (Meia-noite)" },
    theme_light: { message: "Claro" },
    setting_language: { message: "Idioma" },
    setting_language_placeholder: { message: "Selecionar idioma" },
    setting_language_note: {
      message: "Nota: Alterar o idioma recarrega a extensão.",
    },

    security_config_title: { message: "Configuração do Modo Absoluto" },
    security_config_desc: {
      message: "Personalize a intensidade do bloqueio.",
    },
    security_lock_duration: { message: "Duração do Bloqueio" },
    security_duration_note: {
      message: "Duração ajustável em breve. Atualmente fixo em 24h.",
    },
    security_require_password: { message: "Exigir Senha" },
    security_password_desc: {
      message: "Exigir senha para desbloquear ou remover regras.",
    },

    modal_delete_title: { message: "Excluir regra?" },
    modal_delete_desc: {
      message:
        "Esta ação não poderá ser desfeita imediatamente caso você mude de ideia depois.",
    },
    btn_confirm_delete: { message: "Excluir" },
  },

  es: {
    appName: { message: "Bloqueador Aegis" },
    appDesc: {
      message:
        "Escudo de enfoque absoluto. Bloquea distracciones con fuerza mitológica.",
    },
    status_locked: { message: "Aegis Bloqueado" },
    status_active: { message: "Bloqueador Aegis" },
    header_desc_locked: { message: "Modo Absoluto Activo. Se libera en:" },
    header_desc_normal: { message: "Gestiona tus restricciones." },
    btn_lock: { message: "Bloquear Escudo" },
    btn_cancel: { message: "Cancelar" },
    tooltip_unlocks_in: { message: "Se desbloquea en" },
    absolute_mode_active: { message: "Modo Absoluto Activo" },
    modal_title: { message: "¿Activar Modo Absoluto?" },
    modal_description_styled: {
      message:
        "Al activar este modo, {text-foreground:no podrás eliminar} ninguna regla existente durante las próximas {text-foreground:24 horas}.\n\nAún podrás añadir nuevas reglas, pero nada podrá deshacerse hasta que se agote el tiempo.\n\n¿Estás seguro de que quieres hacer este compromiso?",
    },
    modal_confirm: { message: "Sí, Bloquear el Escudo" },
    btn_activate_absolute_mode_tooltip: { message: "Activar Modo Absoluto" },
    btn_export_backup: { message: "Exportar Copia" },
    btn_import_backup: { message: "Importar Copia" },
    btn_expand_options: { message: "Expandir" },
    btn_quick_block_template: { message: "Bloquear {domain} ahora" },
    input_placeholder_example: { message: "Ej: reddit.com/r/memes" },
    btn_add: { message: "Añadir" },
    table_header_url: { message: "Patrón de URL" },
    table_header_action: { message: "Acción" },
    empty_state_title: { message: "Sin reglas activas." },
    empty_state_desc: {
      message: "Tu navegación ahora está completamente libre.",
    },
    btn_remove: { message: "Eliminar" },
    aria_remove_rule: { message: "Eliminar regla para {pattern}" },
    alert_invalid_pattern: {
      message:
        "Por razones de seguridad, el patrón debe coincidir con la estructura de una URL.",
    },
    alert_action_blocked: { message: "Acción bloqueada por el Modo Absoluto." },
    alert_import_success: {
      message: "¡Copia de seguridad importada con éxito!",
    },
    alert_import_error: {
      message: "Error al importar el archivo. Verifica si el JSON es válido.",
    },
    btn_open_settings: { message: "Ajustes" },
    settings_title: { message: "Configuración" },
    settings_subtitle: {
      message: "Personaliza tu experiencia con Aegis",
    },
    loading_settings: { message: "Cargando configuración..." },

    tab_general: { message: "General" },
    tab_appearance: { message: "Apariencia e Idioma" },
    tab_security: { message: "Seguridad (Modo Absoluto)" },

    general_behavior_title: { message: "Comportamiento" },
    general_behavior_desc: {
      message: "Cómo Aegis gestiona reglas e interacciones.",
    },
    setting_double_check: { message: "Confirmar eliminación" },
    setting_double_check_desc: {
      message: "Solicitar confirmación antes de eliminar una regla.",
    },

    appearance_interface_title: { message: "Interfaz" },
    appearance_interface_desc: {
      message: "Haz que Aegis se vea y hable como tú quieras.",
    },
    setting_theme: { message: "Tema" },
    setting_theme_placeholder: { message: "Seleccionar tema" },
    theme_system: { message: "Predeterminado del sistema" },
    theme_dark: { message: "Oscuro (Medianoche)" },
    theme_light: { message: "Claro" },
    setting_language: { message: "Idioma" },
    setting_language_placeholder: { message: "Seleccionar idioma" },
    setting_language_note: {
      message: "Nota: Cambiar el idioma recargará la extensión.",
    },

    security_config_title: {
      message: "Configuración del Modo Absoluto",
    },
    security_config_desc: {
      message: "Personaliza la intensidad del bloqueo.",
    },
    security_lock_duration: { message: "Duración del Bloqueo" },
    security_duration_note: {
      message: "Duración ajustable próximamente. Actualmente fija en 24h.",
    },
    security_require_password: { message: "Requerir contraseña" },
    security_password_desc: {
      message: "Requiere una contraseña para desbloquear o eliminar reglas.",
    },

    modal_delete_title: { message: "¿Eliminar regla?" },
    modal_delete_desc: {
      message:
        "Esta acción no podrá deshacerse inmediatamente si cambias de opinión más tarde.",
    },
    btn_confirm_delete: { message: "Eliminar" },
  },

  de: {
    appName: { message: "Aegis Blocker" },
    appDesc: {
      message:
        "Absoluter Fokusschild. Blockieren Sie Ablenkungen mit mythologischer Stärke.",
    },
    status_locked: { message: "Aegis Gesperrt" },
    status_active: { message: "Aegis Blocker" },
    header_desc_locked: { message: "Absoluter Modus aktiv. Freigabe in:" },
    header_desc_normal: { message: "Verwalten Sie Ihre Einschränkungen." },
    btn_lock: { message: "Schild verriegeln" },
    btn_cancel: { message: "Abbrechen" },
    tooltip_unlocks_in: { message: "Entsperrt in" },
    absolute_mode_active: { message: "Absoluter Modus Aktiv" },
    modal_title: { message: "Absoluten Modus aktivieren?" },
    modal_description_styled: {
      message:
        "Wenn Sie diesen Modus aktivieren, können Sie für die nächsten {text-foreground:24 Stunden} keine bestehenden Regeln {text-foreground:entfernen}.\n\nSie können weiterhin neue Regeln hinzufügen, aber nichts kann rückgängig gemacht werden, bis die Zeit abgelaufen ist.\n\nSind Sie sicher, dass Sie diese Verpflichtung eingehen wollen?",
    },
    modal_confirm: { message: "Ja, Schild verriegeln" },
    btn_activate_absolute_mode_tooltip: {
      message: "Absoluten Modus aktivieren",
    },
    btn_export_backup: { message: "Backup exportieren" },
    btn_import_backup: { message: "Backup importieren" },
    btn_expand_options: { message: "Erweitern" },
    btn_quick_block_template: { message: "{domain} jetzt blockieren" },
    input_placeholder_example: { message: "Bsp: reddit.com/r/memes" },
    btn_add: { message: "Hinzufügen" },
    table_header_url: { message: "URL-Muster" },
    table_header_action: { message: "Aktion" },
    empty_state_title: { message: "Keine aktiven Regeln." },
    empty_state_desc: { message: "Ihr Surfen ist nun völlig uneingeschränkt." },
    btn_remove: { message: "Entfernen" },
    aria_remove_rule: { message: "Regel für {pattern} entfernen" },
    alert_invalid_pattern: {
      message:
        "Aus Sicherheitsgründen muss das Muster einer URL-Struktur entsprechen.",
    },
    alert_action_blocked: {
      message: "Aktion durch Absoluten Modus blockiert.",
    },
    alert_import_success: { message: "Backup erfolgreich importiert!" },
    alert_import_error: {
      message:
        "Fehler beim Importieren der Datei. Prüfen Sie, ob das JSON gültig ist.",
    },
    btn_open_settings: { message: "Einstellungen" },
    settings_title: { message: "Einstellungen" },
    settings_subtitle: {
      message: "Passen Sie Ihr Aegis-Erlebnis an",
    },
    loading_settings: { message: "Einstellungen werden geladen..." },

    tab_general: { message: "Allgemein" },
    tab_appearance: { message: "Erscheinungsbild & Sprache" },
    tab_security: { message: "Sicherheit (Absoluter Modus)" },

    general_behavior_title: { message: "Verhalten" },
    general_behavior_desc: {
      message: "Wie Aegis Regeln und Interaktionen behandelt.",
    },
    setting_double_check: { message: "Löschen bestätigen" },
    setting_double_check_desc: {
      message: "Vor dem Entfernen einer Regel eine Bestätigung anfordern.",
    },

    appearance_interface_title: { message: "Oberfläche" },
    appearance_interface_desc: {
      message: "Lassen Sie Aegis so aussehen und sprechen, wie Sie möchten.",
    },
    setting_theme: { message: "Design" },
    setting_theme_placeholder: { message: "Design auswählen" },
    theme_system: { message: "Systemstandard" },
    theme_dark: { message: "Dunkel (Mitternacht)" },
    theme_light: { message: "Hell" },
    setting_language: { message: "Sprache" },
    setting_language_placeholder: { message: "Sprache auswählen" },
    setting_language_note: {
      message: "Hinweis: Das Ändern der Sprache lädt die Erweiterung neu.",
    },

    security_config_title: {
      message: "Konfiguration des Absoluten Modus",
    },
    security_config_desc: {
      message: "Passen Sie die Intensität der Sperre an.",
    },
    security_lock_duration: { message: "Sperrdauer" },
    security_duration_note: {
      message: "Einstellbare Dauer kommt bald. Aktuell fest auf 24h.",
    },
    security_require_password: { message: "Passwort erforderlich" },
    security_password_desc: {
      message:
        "Ein Passwort zum Entsperren oder Entfernen von Regeln verlangen.",
    },

    modal_delete_title: { message: "Regel löschen?" },
    modal_delete_desc: {
      message:
        "Diese Aktion kann nicht sofort rückgängig gemacht werden, falls Sie es sich später anders überlegen.",
    },
    btn_confirm_delete: { message: "Löschen" },
  },

  zn_CH: {
    appName: { message: "Aegis 拦截器" },
    appDesc: { message: "绝对专注护盾。以神话般的力量阻挡干扰。" },
    status_locked: { message: "Aegis 已锁定" },
    status_active: { message: "Aegis 拦截器" },
    header_desc_locked: { message: "绝对模式已激活。解锁剩余：" },
    header_desc_normal: { message: "管理您的限制规则。" },
    btn_lock: { message: "锁定护盾" },
    btn_cancel: { message: "取消" },
    tooltip_unlocks_in: { message: "解锁倒计时" },
    absolute_mode_active: { message: "绝对模式已激活" },
    modal_title: { message: "激活绝对模式？" },
    modal_description_styled: {
      message:
        "激活此模式后，您在接下来的 {text-foreground:24 小时}内将{text-foreground:无法删除}任何现有规则。\n\n您仍然可以添加新规则，但在时间结束前无法撤销任何操作。\n\n您确定要做出这个承诺吗？",
    },
    modal_confirm: { message: "是的，锁定护盾" },
    btn_activate_absolute_mode_tooltip: { message: "激活绝对模式" },
    btn_export_backup: { message: "导出备份" },
    btn_import_backup: { message: "导入备份" },
    btn_expand_options: { message: "展开" },
    btn_quick_block_template: { message: "立即拦截 {domain}" },
    input_placeholder_example: { message: "例如：reddit.com/r/memes" },
    btn_add: { message: "添加" },
    table_header_url: { message: "URL 模式" },
    table_header_action: { message: "操作" },
    empty_state_title: { message: "无活跃规则。" },
    empty_state_desc: { message: "您的浏览现在完全不受限制。" },
    btn_remove: { message: "移除" },
    aria_remove_rule: { message: "移除规则：{pattern}" },
    alert_invalid_pattern: {
      message: "出于安全原因，该模式必须符合 URL 结构。",
    },
    alert_action_blocked: {
      message: "操作被绝对模式阻止。",
    },
    alert_import_success: { message: "备份导入成功！" },
    alert_import_error: {
      message: "导入文件出错。请检查 JSON 是否有效。",
    },
    btn_open_settings: { message: "设置" },
    settings_title: { message: "设置" },
    settings_subtitle: { message: "自定义你的 Aegis 使用体验" },
    loading_settings: { message: "正在加载设置…" },

    tab_general: { message: "通用" },
    tab_appearance: { message: "外观与语言" },
    tab_security: { message: "安全（绝对模式）" },

    general_behavior_title: { message: "行为" },
    general_behavior_desc: {
      message: "Aegis 如何处理规则和交互。",
    },
    setting_double_check: { message: "删除前确认" },
    setting_double_check_desc: {
      message: "在移除规则前请求确认。",
    },

    appearance_interface_title: { message: "界面" },
    appearance_interface_desc: {
      message: "让 Aegis 按你想要的方式显示和交流。",
    },
    setting_theme: { message: "主题" },
    setting_theme_placeholder: { message: "选择主题" },
    theme_system: { message: "系统默认" },
    theme_dark: { message: "深色（午夜）" },
    theme_light: { message: "浅色" },
    setting_language: { message: "语言" },
    setting_language_placeholder: { message: "选择语言" },
    setting_language_note: {
      message: "注意：更改语言将重新加载扩展。",
    },

    security_config_title: { message: "绝对模式配置" },
    security_config_desc: {
      message: "自定义锁定的强度。",
    },
    security_lock_duration: { message: "锁定时长" },
    security_duration_note: {
      message: "可调节时长即将推出，目前固定为 24 小时。",
    },
    security_require_password: { message: "需要密码" },
    security_password_desc: {
      message: "解锁或移除规则时需要输入密码。",
    },

    modal_delete_title: { message: "删除规则？" },
    modal_delete_desc: {
      message: "如果您之后改变主意，此操作将无法立即撤销。",
    },
    btn_confirm_delete: { message: "删除" },
  },
};

export const setDevLocale = (locale: string | null) => {
  if (locale) {
    localStorage.setItem("aegis_dev_locale", locale);
  } else {
    localStorage.removeItem("aegis_dev_locale");
  }
  window.location.reload();
};

export const getCurrentLocale = () => {
  return localStorage.getItem("aegis_dev_locale") || "en (System)";
};

export const t = (key: string, placeholders?: string[]): string => {
  const forcedLocale = localStorage.getItem("aegis_dev_locale");

  if (forcedLocale && TEST_LOCALES[forcedLocale]) {
    const entry = TEST_LOCALES[forcedLocale][key];
    if (entry) {
      let msg = entry.message;
      if (placeholders) {
        placeholders.forEach((val, idx) => {
          msg = msg.replace(`$${idx + 1}`, val);
        });
      }
      return msg;
    }
  }

  if (typeof chrome !== "undefined" && chrome.i18n) {
    return chrome.i18n.getMessage(key, placeholders) || key;
  }

  return key;
};
