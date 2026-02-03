export const ACCOMMODATIONS_MASTER = {
  presentation: [
    {
      id: 'oral_presentation_text_read_aloud',
      label: 'Oral presentation – Text read aloud to student',
      subOptions: [
        { id: 'oral_human_reader', label: 'Oral presentation by a human reader' },
        { id: 'oral_text_to_speech', label: 'Text-to-speech technology' }
      ]
    },
    {
      id: 'oral_presentation_allowable_components',
      label: 'Oral presentation of allowable components',
      subOptions: [
        { id: 'oral_allowable_human_reader', label: 'Oral presentation by a human reader' },
        { id: 'oral_allowable_tts', label: 'Text-to-speech accommodation embedded in computer-based test (when available)' }
      ]
    },
    {
      id: 'student_reads_aloud',
      label: 'Student reads aloud to self',
      subOptions: [
        { id: 'whisper_phone', label: 'Whisper phone or similar device' },
        { id: 'recording_device', label: 'Recording device' }
      ]
    },
    {
      id: 'signed_presentation_oral',
      label: 'Signed presentation of content presented orally',
      subOptions: [
        { id: 'asl', label: 'American Sign Language (ASL)' },
        { id: 'see', label: 'Signed Exact English (SEE)' },
        { id: 'case', label: 'Conceptually Accurate Signed English (CASE)' },
        { id: 'cued_speech', label: 'Cued Speech' },
        { id: 'total_communication', label: 'Total Communication' }
      ],
      other: true
    },
    {
      id: 'signed_presentation_written_text',
      label: 'Signed presentation of written text',
      subOptions: [
        { id: 'asl2', label: 'American Sign Language (ASL)' },
        { id: 'see2', label: 'Signed Exact English (SEE)' },
        { id: 'case2', label: 'Conceptually Accurate Signed English (CASE)' },
        { id: 'cued_speech2', label: 'Cued Speech' },
        { id: 'total_comm2', label: 'Total Communication' }
      ],
      other: true
    },
    {
      id: 'signed_presentation_allowable_components_written',
      label: 'Signed presentation of allowable components',
      subOptions: [
        { id: 'asl3', label: 'American Sign Language (ASL)' },
        { id: 'see3', label: 'Signed Exact English (SEE)' },
        { id: 'case3', label: 'Conceptually Accurate Signed English (CASE)' },
        { id: 'cued_speech3', label: 'Cued Speech' },
        { id: 'total_comm3', label: 'Total Communication' }
      ],
      other: true
    },
    { id: 'english_sign_translation_dict', label: 'English/sign language or sign language/English translation dictionary' },
    { id: 'closed_captioning', label: 'Closed captioning of audio content' },
    { id: 'asl_video_audio', label: 'ASL video of audio content' },
    { id: 'external_speakers', label: 'External speakers', tags: ['valid_thru_dec_2022'] },
    { id: 'verbal_description_images', label: 'Verbal description of images or reading of descriptive text' },
    {
      id: 'paper_based_accommodation_classroom',
      label: 'Paper-based accommodation for computer-based instruction or classroom test',
      subOptions: [
        { id: 'regular_print', label: 'Regular print' },
        { id: 'large_print', label: 'Large print' },
        { id: 'one_item_per_page', label: 'One item per page' },
        { id: 'contracted_braille_ueb_math', label: 'Contracted braille – UEB Math/Science' },
        { id: 'contracted_braille_ueb_nemeth', label: 'Contracted braille – UEB with Nemeth' },
        { id: 'uncontracted_braille_ueb_math', label: 'Uncontracted braille – UEB Math/Science' },
        { id: 'uncontracted_braille_ueb_nemeth', label: 'Uncontracted braille – UEB with Nemeth' }
      ]
    },
    {
      id: 'paper_based_accommodation_assessment',
      label: 'Paper-based accommodation for computer-based assessment',
      subOptions: [
        { id: 'regular_print_assess', label: 'Regular print' },
        { id: 'large_print_assess', label: 'Large print' },
        { id: 'one_item_per_page_assess', label: 'One item per page' },
        { id: 'contracted_braille_ueb_math_assess', label: 'Contracted braille – UEB Math/Science' },
        { id: 'contracted_braille_ueb_nemeth_assess', label: 'Contracted braille – UEB with Nemeth' },
        { id: 'uncontracted_braille_ueb_math_assess', label: 'Uncontracted braille – UEB Math/Science' },
        { id: 'uncontracted_braille_ueb_nemeth_assess', label: 'Uncontracted braille – UEB with Nemeth' }
      ],
      extras: [
        { id: 'flexible_schedule_testing_over_multiple_days', label: 'The student has a flexible schedule/extended time accommodation that requires testing one session over more than one day' },
        { id: 'homebound_or_hospitalized', label: 'The student is homebound or hospitalized' },
        { id: 'resides_in_doc_djj', label: 'The student resides in a Department of Corrections (DOC) or Department of Juvenile Justice (DJJ) facility where Internet access is not available' },
        { id: 'computer_based_not_accessible_reason', label: 'The computer-based assessment is not accessible by or appropriate for the student at this time for the following reason', textarea: true }
      ]
    },
    { id: 'altered_format_classroom', label: 'Altered format for paper-based classroom materials', subOptionsKey: 'paper_based_accommodation_classroom' },
    { id: 'altered_format_assess', label: 'Altered format for paper-based assessments', subOptionsKey: 'paper_based_accommodation_assessment' },
    { id: 'print_size_enlarged', label: 'Print size enlarged (computer)' },
    { id: 'color_contrast', label: 'Color contrast setting (computer)' },
    { id: 'masking_tool', label: 'Masking tool to focus attention (e.g., embedded in computer-based program/test; blank card)' },
    { id: 'line_reader', label: 'Line reader to maintain or enhance visual attention' },
    { id: 'computer_magnification', label: 'Computer-based magnification feature (e.g., zoom in/zoom out)' },
    { id: 'other_magnification_device', label: 'Other magnification device (e.g., CCTV/video magnifier; reading loupe; handheld magnifier)' },
    { id: 'highlighter', label: 'Highlighter (e.g., highlighting tool embedded in computer-based program; highlighting markers)' },
    { id: 'positioning_tools', label: 'Positioning tools (e.g., book stand)' },
    { id: 'materials_secured', label: 'Materials secured to the work area' },
    { id: 'colored_transparencies', label: 'Colored transparencies, overlays, filters, or eyeglasses with colored lenses' },
    { id: 'real_coins', label: 'Real coins to represent coins depicted in mathematics problems', tags: ['vi_dsi_only_for_general', 'allowable_for_alternate'] },
    { id: 'secure_attention', label: 'Secure student attention before directions are given' },
    { id: 'directions_repeated', label: 'Directions repeated, clarified, or summarized', note: 'in accordance with applicable assessment manual' },
    { id: 'student_demonstrate_understanding', label: 'Student to demonstrate understanding of directions (e.g., repeating or paraphrasing)' },
    { id: 'copy_of_directions', label: 'Copy of directions provided to student' },
    { id: 'verbal_encouragement', label: 'Verbal encouragement, prompts, or cues to stay on task (e.g., "keep working"; "make sure to answer every question")' },
    { id: 'hardcopy_passage_booklets', label: 'Hardcopy passage booklets for computer-based FSA ELA Reading Retake and Writing Retake tests', subOptions: [
      { id: 'hardcopy_regular', label: 'Regular print' },
      { id: 'hardcopy_large', label: 'Large print' },
      { id: 'hardcopy_recorded_books', label: 'Recorded books and texts' }
    ] },
    { id: 'advance_organizers', label: 'Advance organizers' },
    { id: 'leveled_books', label: 'Leveled books' },
    { id: 'note_taking_assistance', label: 'Note taking assistance' },
    { id: 'portable_scanning_device', label: 'Portable scanning device' },
    { id: 'sample_problems', label: 'Sample problems and tasks' },
    { id: 'simplified_or_graphic_directions', label: 'Simplified or graphic directions' },
    { id: 'tactile_graphic_images', label: 'Tactile graphic images', tags: ['allowable_for_alternate_only'] },
    { id: 'use_of_real_objects', label: 'Use of real objects during instruction', tags: ['allowable_for_alternate_only_real_objects'] },
    { id: 'physical_cuing', label: 'Physical cuing or redirection (e.g., lightly touching student\'s hand; tapping the work surface; pointing to relevant content)', tags: ['allowable_for_alternate_only_physical_cuing'] },
    { id: 'other_presentation_accommodation', label: 'Other presentation accommodation (if allowable)', textarea: true }
  ],
  response: [
    { id: 'periodic_checks', label: 'Periodic checks to ensure student is responding to the task as instructed' },
    { id: 'dictation_scribe', label: 'Dictation of responses to a scribe' },
    { id: 'dictation_audio_recorder', label: 'Dictation of responses to an audio recorder' },
    { id: 'answers_marked_directly', label: 'Answers marked directly on materials' },
    { id: 'sign_responses_interpreter', label: 'Sign responses to a sign language interpreter' },
    { id: 'braillewriter', label: 'Braillewriter' },
    { id: 'speech_to_text', label: 'Speech-to-text technology' },
    { id: 'other_alternative_device', label: 'Other alternative device to enter response', textarea: true },
    { id: 'slant_board', label: 'Slant board to aid in writing and/or reading' },
    { id: 'special_paper', label: 'Special paper (e.g., raised line, shaded line, color coded, or blank paper)' },
    { id: 'pencil_grips', label: 'Pencil grips, spacers, or other handwriting supports' },
    { id: 'gridded_paper', label: 'Gridded paper for math computation' },
    { id: 'calculator', label: 'Calculator', subOptions: [
      { id: 'calc_handheld', label: 'Handheld' },
      { id: 'calc_large_key', label: 'Large key' },
      { id: 'calc_large_display', label: 'Large display' },
      { id: 'calc_talking', label: 'Talking calculator' },
      { id: 'calc_other', label: 'Other: (text input)', other: true }
    ] },
    { id: 'calculator_allowable_sections', label: 'Calculator for allowable sections in accordance with assessment manual', subOptionsKey: 'calculator' },
    { id: 'graphic_aids_substitute', label: 'Graphic aids as a substitute for paper/pencil calculation', subOptions: [
      { id: 'geoboard', label: 'Geoboard' },
      { id: 'math_windows', label: 'Math Windows' },
      { id: 'graphic_aid_math', label: 'Graphic Aid for Mathematics' },
      { id: 'graphic_aid_other', label: 'Other: (text input)', other: true }
    ] },
    { id: 'graphic_aids_vi_dsi', label: 'Graphic aids as a substitute for paper/pencil calculation, allowable only for students with VI or DSI', subOptionsKey: 'graphic_aids_substitute', tags: ['vi_dsi_only'] },
    { id: 'increased_wait_time', label: 'Increased wait time for student response', tags: ['allowable_for_alternate_only_wait_time'] },
    { id: 'dictionary_thesaurus', label: 'Dictionary or thesaurus' },
    { id: 'graphic_organizers', label: 'Graphic organizers or outlines' },
    { id: 'spelling_grammar_software', label: 'Spelling and/or grammar checking software' },
    { id: 'math_manipulatives', label: 'Math manipulatives or concrete materials', tags: ['allowable_for_alternate_only_if_used_consistently'] },
    { id: 'dry_erase_board', label: 'Dry erase board to plan or do work' },
    { id: 'aac_device', label: 'Augmentative or alternative communication device' },
    { id: 'raised_number_line', label: 'Raised number line', tags: ['allowable_for_alternate_only'] },
    { id: 'braille_ruler', label: 'Braille ruler', tags: ['allowable_for_alternate_only'] },
    { id: 'other_response_accommodation', label: 'Other response accommodation (if allowable)', textarea: true }
  ],
  scheduling: [
    { id: 'allow_extended_time', label: 'Allow extended time' },
    { id: 'allow_frequent_breaks', label: 'Allow frequent breaks', note: 'Administer assessment over several short periods within one school day to allow frequent breaks' },
    { id: 'preferred_time_of_day', label: 'Specific activities provided at a preferred time of day', note: 'Administer assessment at a preferred time of day' },
    { id: 'alert_transitions', label: 'Alert student of transitions or schedule changes ahead of time' },
    { id: 'regular_check_in', label: 'Regularly scheduled check in with designated person' },
    { id: 'timer_alarm', label: 'Timer or alarm (e.g., to signal student; define work periods)' },
    { id: 'visual_schedule', label: 'Visual schedule' },
    { id: 'other_scheduling', label: 'Other scheduling accommodation (if allowable)', textarea: true }
  ],
  setting: [
    { id: 'familiar_place', label: 'Assignments or classroom tests provided in a familiar place', note: 'Assessment administered in a familiar place' },
    { id: 'familiar_person', label: 'Assignments or classroom tests provided by a familiar person', note: 'Assessment administered by a familiar person' },
    { id: 'individual_setting', label: 'Assignments or classroom tests provided in an individual setting', note: 'Assessment administered in an individual setting' },
    { id: 'small_group', label: 'Instruction and/or classroom tests provided in a small group setting', note: 'Assessment administered in a small group setting comparable to the student\'s normal instructional group size' },
    { id: 'special_lighting', label: 'Special lighting or other visual sensory accommodation (e.g., glare reduction filter; shade)' , helper: 'FM system, CADS, Bluetooth, sound field systems'},
    { id: 'special_acoustics', label: 'Special acoustics or auditory amplification device' },
    { id: 'adaptive_furniture', label: 'Adaptive or special furniture, positioning or physical support' },
    { id: 'white_noise', label: 'White noise, sound machine or approved music' },
    { id: 'noise_reducing_headphones', label: 'Noise reducing headphones' },
    { id: 'reduced_stimuli', label: 'Reduced stimuli (e.g., visual or auditory distractions around student\'s area)' },
    { id: 'increased_opportunity_movement', label: 'Increased opportunity for movement' },
    { id: 'decreased_opportunity_movement', label: 'Decreased opportunity for movement' },
    { id: 'preferential_seating', label: 'Preferential seating (e.g., proximity to staff or positive role model; to see or hear instruction)' },
    { id: 'consistent_routines', label: 'Consistent or predictable routines and procedures' },
    { id: 'designated_break_place', label: 'Designated place to take a break' },
    { id: 'extra_textbooks', label: 'Extra set of textbooks for home use' },
    { id: 'supervision_physical_safety', label: 'Supervision to ensure physical safety' },
    { id: 'other_setting', label: 'Other setting accommodation (if allowable)', textarea: true }
  ],
  assistive: [
    { id: 'stress_aid', label: 'Stress-relieving aid (e.g., stress ball)' },
    { id: 'keyboard_support', label: 'Keyboard support' },
    { id: 'light_box', label: 'Light box', tags: ['allowable_for_alternate_only'] },
    { id: 'other_assistive', label: 'Other assistive technology or device accommodation (if allowable)', textarea: true }
  ]
};
