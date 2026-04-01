package interview.guide.modules.resume.service;

import interview.guide.common.ai.StructuredOutputInvoker;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.model.ResumeAnalysisResponse;
import interview.guide.modules.interview.model.ResumeAnalysisResponse.ScoreDetail;
import interview.guide.modules.interview.model.ResumeAnalysisResponse.Suggestion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 简历评分服务
 * 使用Spring AI调用LLM对简历进行评分和建议
 */
@Service
public class ResumeGradingService {
    
    private static final Logger log = LoggerFactory.getLogger(ResumeGradingService.class);  //日志记录器，用于在分析过程中输出信息。
    
    private final ChatClient chatClient; //Spring AI 提供的客户端，用于调用大语言模型（LLM）。
    private final PromptTemplate systemPromptTemplate;  //提示词模板，用于渲染系统提示和用户提示。
    private final PromptTemplate userPromptTemplate;  //
    private final BeanOutputConverter<ResumeAnalysisResponseDTO> outputConverter;//Spring AI 的工具类，将模型返回的 JSON 字符串转换为 Java 对象（这里的目标类型是内部记录 ResumeAnalysisResponseDTO）。
    private final StructuredOutputInvoker structuredOutputInvoker;   //自定义组件，负责执行结构化输出调用（内部可能封装了重试、异常处理等）。

    // 中间DTO用于接收AI响应
    //字段名与提示词中要求的JSON格式一致，BeanOutputConverter会自动将JSON转换为对象
    private record ResumeAnalysisResponseDTO(
        int overallScore,
        ScoreDetailDTO scoreDetail,
        String summary,
        List<String> strengths,
        List<SuggestionDTO> suggestions
    ) {}
    
    private record ScoreDetailDTO(
        int contentScore,
        int structureScore,
        int skillMatchScore,
        int expressionScore,
        int projectScore
    ) {}
    
    private record SuggestionDTO(
        String category,
        String priority,
        String issue,
        String recommendation
    ) {}
    
    public ResumeGradingService(   //构造函数与依赖注入
            ChatClient.Builder chatClientBuilder,
            StructuredOutputInvoker structuredOutputInvoker,
            @Value("classpath:prompts/resume-analysis-system.st") Resource systemPromptResource,
            @Value("classpath:prompts/resume-analysis-user.st") Resource userPromptResource) throws IOException {
        this.chatClient = chatClientBuilder.build();
        this.structuredOutputInvoker = structuredOutputInvoker;
        this.systemPromptTemplate = new PromptTemplate(systemPromptResource.getContentAsString(StandardCharsets.UTF_8));
        this.userPromptTemplate = new PromptTemplate(userPromptResource.getContentAsString(StandardCharsets.UTF_8));
        this.outputConverter = new BeanOutputConverter<>(ResumeAnalysisResponseDTO.class);
    }
    
    /**
     * 分析简历并返回评分和建议
     * 
     * @param resumeText 简历文本内容
     * @return 分析结果
     */
    public ResumeAnalysisResponse analyzeResume(String resumeText) {
        log.info("开始分析简历，文本长度: {} 字符", resumeText.length());
        
        try {
            // 1.加载系统提示词
            String systemPrompt = systemPromptTemplate.render();
            
            //2.  加载用户提示词并填充变量
            Map<String, Object> variables = new HashMap<>();
            variables.put("resumeText", resumeText);
            String userPrompt = userPromptTemplate.render(variables);
            
            // 3. 添加格式指令到系统提示词
            String systemPromptWithFormat = systemPrompt + "\n\n" + outputConverter.getFormat();
            
            // 4. 调用AI
            ResumeAnalysisResponseDTO dto;
            try {
                dto = structuredOutputInvoker.invoke(
                    chatClient,
                    systemPromptWithFormat,
                    userPrompt,
                    outputConverter,
                    ErrorCode.RESUME_ANALYSIS_FAILED,
                    "简历分析失败：",
                    "简历分析",
                    log
                );
                log.debug("AI响应解析成功: overallScore={}", dto.overallScore());
            } catch (Exception e) {
                log.error("简历分析AI调用失败: {}", e.getMessage(), e);
                throw new BusinessException(ErrorCode.RESUME_ANALYSIS_FAILED, "简历分析失败：" + e.getMessage());
            }
            
            // 转换为业务对象
            ResumeAnalysisResponse result = convertToResponse(dto, resumeText);
            log.info("简历分析完成，总分: {}", result.overallScore());
            
            return result;

        } catch (Exception e) {
            log.error("简历分析失败: {}", e.getMessage(), e);
            return createErrorResponse(resumeText, e.getMessage());
        }
    }
    
    /**
     * 转换DTO为业务对象
     */
    private ResumeAnalysisResponse convertToResponse(ResumeAnalysisResponseDTO dto, String originalText) {
        ScoreDetail scoreDetail = new ScoreDetail(
            dto.scoreDetail().contentScore(),
            dto.scoreDetail().structureScore(),
            dto.scoreDetail().skillMatchScore(),
            dto.scoreDetail().expressionScore(),
            dto.scoreDetail().projectScore()
        );
        
        List<Suggestion> suggestions = dto.suggestions().stream()
            .map(s -> new Suggestion(s.category(), s.priority(), s.issue(), s.recommendation()))
            .toList();
        
        return new ResumeAnalysisResponse(
            dto.overallScore(),
            scoreDetail,
            dto.summary(),
            dto.strengths(),
            suggestions,
            originalText
        );
    }
    
    /**
     * 创建错误响应
     */
    private ResumeAnalysisResponse createErrorResponse(String originalText, String errorMessage) {
        return new ResumeAnalysisResponse(
            0,
            new ScoreDetail(0, 0, 0, 0, 0),
            "分析过程中出现错误: " + errorMessage,
            List.of(),
            List.of(new Suggestion(
                "系统",
                "高",
                "AI分析服务暂时不可用",
                "请稍后重试，或检查AI服务是否正常运行"
            )),
            originalText
        );
    }
}
